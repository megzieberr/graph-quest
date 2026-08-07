/* Supabase project URL + PUBLISHABLE key.
   The publishable key is public-safe and is committed on purpose —
   row-level security is on with no table policies, so it can only
   call the SECURITY DEFINER functions in supabase/schema.sql.

   The SECRET / service-role key must NEVER appear in this repo.

   Until these are filled in, the app runs fully on the local
   backend (js/backend.js) — nothing breaks, progress just lives
   on the device. */
export const SUPABASE = {
  url: "https://YOUR-PROJECT.supabase.co",
  key: "YOUR-PUBLISHABLE-KEY",
};
