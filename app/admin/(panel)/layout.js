import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminNav from '@/components/admin/AdminNav';
import SignOutButton from '@/components/admin/SignOutButton';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <main className="container-x py-20">
        <div className="card max-w-xl p-8">
          <p className="font-heading text-2xl font-bold text-brand">Supabase is not connected</p>
          <p className="mt-2 text-white/70">
            Add your Supabase keys to <code>.env.local</code> (see README.md) and restart the server.
          </p>
        </div>
      </main>
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  // Second lock: the logged-in person must be listed in the "admin_users" table.
  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!adminRow) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="card max-w-md p-8 text-center">
          <p className="font-heading text-2xl font-bold text-brand">Not authorised</p>
          <p className="mt-3 text-sm text-white/70">
            You are logged in as <strong>{user.email}</strong>, but this account is not an administrator of the store.
          </p>
          <div className="mt-6 flex justify-center">
            <SignOutButton className="btn-red" label="Log out" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="lg:flex">
      <AdminNav email={user.email} />
      <div className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-10">{children}</div>
    </div>
  );
}
