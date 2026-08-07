-- ============================================================
-- GRAPH QUEST — database schema
-- ------------------------------------------------------------
-- Run this ONCE in the Supabase SQL editor (Dashboard → SQL
-- Editor → New query → paste → Run). It is idempotent: running
-- it twice is harmless.
--
-- Security model (same as blipwork / maths-quest):
--   * Row-level security is ON with NO table policies, so the
--     public key cannot read or write a single row directly.
--   * Everything goes through SECURITY DEFINER functions below.
--   * Passwords are bcrypt-hashed server-side. The teacher can
--     CLEAR a password (so the learner sets a new one) but can
--     never read one.
--
-- Learners self-sign-up with a username + password. No email,
-- no magic links.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- tables ----------
create table if not exists gq_learners (
  id          uuid primary key default gen_random_uuid(),
  username    text unique not null,
  pass_hash   text,                       -- null = "must set a new password"
  is_admin    boolean not null default false,
  xp          integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists gq_sessions (
  token       uuid primary key default gen_random_uuid(),
  learner_id  uuid not null references gq_learners(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table if not exists gq_progress (
  learner_id  uuid not null references gq_learners(id) on delete cascade,
  quest_id    text not null,
  best        integer not null default 0,
  total       integer not null default 0,
  plays       integer not null default 0,
  done        boolean not null default false,
  updated_at  timestamptz not null default now(),
  primary key (learner_id, quest_id)
);

create index if not exists gq_sessions_learner on gq_sessions(learner_id);

-- ---------- lock everything down ----------
alter table gq_learners enable row level security;
alter table gq_sessions enable row level security;
alter table gq_progress enable row level security;
-- deliberately NO policies: the anon key can only call the functions below.

revoke all on gq_learners, gq_sessions, gq_progress from anon, authenticated;

-- ============================================================
-- helper: token -> learner
-- ============================================================
create or replace function gq_learner_of(p_token uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select learner_id from gq_sessions where token = p_token;
$$;

-- ============================================================
-- sign up  (username + password, bcrypt-hashed here)
-- ============================================================
create or replace function gq_signup(p_username text, p_password text)
returns json language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_token uuid;
begin
  if length(coalesce(p_username,'')) < 2 then
    raise exception 'username too short';
  end if;
  if length(coalesce(p_password,'')) < 4 then
    raise exception 'password too short';
  end if;
  if exists (select 1 from gq_learners where lower(username) = lower(p_username)) then
    raise exception 'that name is taken';
  end if;

  insert into gq_learners(username, pass_hash)
  values (p_username, crypt(p_password, gen_salt('bf')))
  returning id into v_id;

  insert into gq_sessions(learner_id) values (v_id) returning token into v_token;
  return json_build_object('token', v_token, 'name', p_username, 'xp', 0, 'quests', '{}'::json);
end $$;

-- ============================================================
-- log in
-- ============================================================
create or replace function gq_login(p_username text, p_password text)
returns json language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_hash text; v_token uuid;
begin
  select id, pass_hash into v_id, v_hash
  from gq_learners where lower(username) = lower(p_username);

  if v_id is null then raise exception 'no such name'; end if;
  if v_hash is null then raise exception 'password was reset — set a new one'; end if;
  if crypt(p_password, v_hash) <> v_hash then raise exception 'wrong password'; end if;

  insert into gq_sessions(learner_id) values (v_id) returning token into v_token;
  return gq_profile(v_token);
end $$;

-- ============================================================
-- set a password after the teacher cleared it
-- ============================================================
create or replace function gq_set_password(p_username text, p_password text)
returns json language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_hash text; v_token uuid;
begin
  select id, pass_hash into v_id, v_hash
  from gq_learners where lower(username) = lower(p_username);
  if v_id is null then raise exception 'no such name'; end if;
  if v_hash is not null then raise exception 'this name already has a password'; end if;
  if length(coalesce(p_password,'')) < 4 then raise exception 'password too short'; end if;

  update gq_learners set pass_hash = crypt(p_password, gen_salt('bf')) where id = v_id;
  insert into gq_sessions(learner_id) values (v_id) returning token into v_token;
  return gq_profile(v_token);
end $$;

-- ============================================================
-- read the profile + all progress
-- ============================================================
create or replace function gq_profile(p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  v_id := gq_learner_of(p_token);
  if v_id is null then raise exception 'not signed in'; end if;

  return (
    select json_build_object(
      'token', p_token,
      'name', l.username,
      'xp', l.xp,
      'isAdmin', l.is_admin,
      'quests', coalesce((
        select json_object_agg(p.quest_id, json_build_object(
          'best', p.best, 'total', p.total, 'plays', p.plays, 'done', p.done))
        from gq_progress p where p.learner_id = l.id
      ), '{}'::json)
    )
    from gq_learners l where l.id = v_id
  );
end $$;

-- ============================================================
-- save a finished round
--   NOTE: find-then-write, never .upsert() against a partial
--   unique index (that is the 42P10 trap that has bitten before).
--   Here the primary key is a plain composite, so ON CONFLICT is
--   safe and is used deliberately.
-- ============================================================
create or replace function gq_save_result(
  p_token uuid, p_quest text, p_score integer, p_total integer, p_xp integer)
returns json language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  v_id := gq_learner_of(p_token);
  if v_id is null then raise exception 'not signed in'; end if;
  if p_total is null or p_total <= 0 then raise exception 'bad round'; end if;
  if p_score < 0 or p_score > p_total then raise exception 'bad score'; end if;
  if p_xp < 0 or p_xp > 500 then raise exception 'bad xp'; end if;   -- cheat guard

  insert into gq_progress(learner_id, quest_id, best, total, plays, done, updated_at)
  values (v_id, p_quest, p_score, p_total, 1, p_score >= ceil(p_total * 0.7), now())
  on conflict (learner_id, quest_id) do update
    set best  = greatest(gq_progress.best, excluded.best),
        total = excluded.total,
        plays = gq_progress.plays + 1,
        done  = gq_progress.done or excluded.done,
        updated_at = now();

  update gq_learners set xp = xp + p_xp where id = v_id;
  return gq_profile(p_token);
end $$;

-- ============================================================
-- rename / reset
-- ============================================================
create or replace function gq_set_name(p_token uuid, p_name text)
returns json language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  v_id := gq_learner_of(p_token);
  if v_id is null then raise exception 'not signed in'; end if;
  update gq_learners set username = p_name where id = v_id;
  return gq_profile(p_token);
end $$;

create or replace function gq_reset(p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  v_id := gq_learner_of(p_token);
  if v_id is null then raise exception 'not signed in'; end if;
  delete from gq_progress where learner_id = v_id;
  update gq_learners set xp = 0 where id = v_id;
  return gq_profile(p_token);
end $$;

-- ============================================================
-- teacher view (admins only) — who is stuck on what
-- ============================================================
create or replace function gq_class(p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  v_id := gq_learner_of(p_token);
  if v_id is null or not (select is_admin from gq_learners where id = v_id) then
    raise exception 'not allowed';
  end if;
  return (
    select coalesce(json_agg(json_build_object(
      'name', l.username, 'xp', l.xp,
      'quests', coalesce((
        select json_object_agg(p.quest_id, json_build_object('best', p.best, 'total', p.total, 'plays', p.plays))
        from gq_progress p where p.learner_id = l.id), '{}'::json)
    ) order by l.username), '[]'::json)
    from gq_learners l where not l.is_admin
  );
end $$;

-- teacher clears a password; the learner then sets a new one and
-- keeps every bit of progress
create or replace function gq_clear_password(p_token uuid, p_username text)
returns json language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  v_id := gq_learner_of(p_token);
  if v_id is null or not (select is_admin from gq_learners where id = v_id) then
    raise exception 'not allowed';
  end if;
  update gq_learners set pass_hash = null where lower(username) = lower(p_username);
  return json_build_object('ok', true);
end $$;

-- ============================================================
-- the ONLY things the public key may do
-- ============================================================
revoke all on function gq_learner_of(uuid) from anon, authenticated, public;

grant execute on function
  gq_signup(text, text),
  gq_login(text, text),
  gq_set_password(text, text),
  gq_profile(uuid),
  gq_save_result(uuid, text, integer, integer, integer),
  gq_set_name(uuid, text),
  gq_reset(uuid),
  gq_class(uuid),
  gq_clear_password(uuid, text)
to anon, authenticated;

-- ============================================================
-- AFTER RUNNING THIS: make yourself the admin.
-- Sign up in the app with your own username first, then run:
--    update gq_learners set is_admin = true where username = 'YOUR-NAME';
-- Real learner names and real passwords never go in this repo.
-- ============================================================
