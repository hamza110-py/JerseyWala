import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Used on the server to find out who is logged in (admin layout).
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(list) {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch (e) {
            // Called from a Server Component: safe to ignore (middleware refreshes the session).
          }
        },
      },
    }
  );
}
