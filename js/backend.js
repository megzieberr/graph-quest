/* ============================================================
   PROGRESS STORAGE
   ------------------------------------------------------------
   Local-first, exactly like blipwork: everything works offline
   against localStorage, and the cloud is a drop-in replacement
   behind the same four calls.

   `?local=1` forces local mode and sticks (localStorage gq.forceLocal),
   so testing can never write to the real database by accident.

   The Supabase side talks ONLY to SECURITY DEFINER functions —
   see supabase/schema.sql. Row-level security is on with no table
   policies, so the public key cannot read or write a table directly.
   ============================================================ */
import { SUPABASE } from "./supabase-config.js";

const KEY = "gq.progress";
const LOCAL_FLAG = "gq.forceLocal";

/* met: { questId: { skillId: true, … } } — which round KINDS a learner
   has actually had presented in play (qK's dealEachKindFirst ruling,
   2026-08-21). Lives at the top level, never inside quests[questId] —
   saveResult() below REPLACES that record wholesale on every play, so a
   met-record nested in there would be wiped the moment a quest finished. */
const blank = () => ({ name: null, xp: 0, quests: {}, met: {} });

function read() {
  try { return { ...blank(), ...JSON.parse(localStorage.getItem(KEY) || "{}") }; }
  catch { return blank(); }
}
function write(p) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode */ }
}

/* ---------------- local backend ---------------- */
const LocalBackend = {
  kind: "local",
  async profile() { return read(); },
  async saveResult(questId, score, total, xp) {
    const p = read();
    const prev = p.quests[questId] || { best: 0, plays: 0, done: false };
    p.quests[questId] = {
      best: Math.max(prev.best, score),
      total,
      plays: prev.plays + 1,
      done: prev.done || (total > 0 && score / total >= 0.7),   // matches play.js PASS
    };
    p.xp += xp;
    write(p);
    return p;
  },
  async setName(name) { const p = read(); p.name = name; write(p); return p; },
  /* "met" = the round was actually PRESENTED to the learner in play
     (play.js's render() calls this once per skillId per play, the moment
     an item is shown) — never merely dealt into a list they might quit
     before reaching. Idempotent: a skill already marked never re-writes. */
  async markMet(questId, skillId) {
    const p = read();
    p.met = p.met || {};
    p.met[questId] = p.met[questId] || {};
    if (!p.met[questId][skillId]) {
      p.met[questId][skillId] = true;
      write(p);
    }
    return p;
  },
  async reset() { write(blank()); return read(); },
};

/* ---------------- supabase backend ---------------- */
function cloudBackend() {
  let token = null;
  const call = async (fn, body) => {
    const res = await fetch(`${SUPABASE.url}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE.key,
        Authorization: `Bearer ${SUPABASE.key}`,
      },
      body: JSON.stringify(body || {}),
    });
    if (!res.ok) throw new Error(`${fn} failed (${res.status})`);
    return res.json();
  };
  return {
    kind: "cloud",
    setToken(t) { token = t; },
    async profile() { return call("gq_profile", { p_token: token }); },
    async saveResult(questId, score, total, xp) {
      return call("gq_save_result", { p_token: token, p_quest: questId, p_score: score, p_total: total, p_xp: xp });
    },
    async setName(name) { return call("gq_set_name", { p_token: token, p_name: name }); },
    /* mirrors LocalBackend.markMet() — the future cloud schema inherits
       this field; the RPC itself is not written yet (schema.sql is still
       "written, not run"), same status as every other gq_* call here. */
    async markMet(questId, skillId) {
      return call("gq_mark_met", { p_token: token, p_quest: questId, p_skill: skillId });
    },
    async reset() { return call("gq_reset", { p_token: token }); },
  };
}

/* ---------------- pick one ---------------- */
export function chooseBackend() {
  const url = new URL(location.href);
  if (url.searchParams.get("local") === "1") {
    try { localStorage.setItem(LOCAL_FLAG, "1"); } catch { /* ignore */ }
  }
  let forced = false;
  try { forced = localStorage.getItem(LOCAL_FLAG) === "1"; } catch { /* ignore */ }
  const configured = SUPABASE.url && SUPABASE.key && !SUPABASE.url.includes("YOUR-PROJECT");
  return forced || !configured ? LocalBackend : cloudBackend();
}

export { LocalBackend };
