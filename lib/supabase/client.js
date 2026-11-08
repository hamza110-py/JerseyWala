import { createBrowserClient } from '@supabase/ssr';

// Used inside the admin pages (runs in the browser). Uses the public "anon" key only;
// Row Level Security in the database decides what the logged-in user may do.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
