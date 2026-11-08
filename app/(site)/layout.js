import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingInstagram from '@/components/FloatingInstagram';
import { getSettings } from '@/lib/settings';
import { isSupabaseConfigured } from '@/lib/supabase/public';
import { instagramLinks } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function SiteLayout({ children }) {
  if (!isSupabaseConfigured()) {
    return (
      <main className="container-x flex min-h-screen items-center justify-center py-20">
        <div className="card max-w-xl p-8">
          <p className="font-heading text-3xl font-bold text-brand">Almost there!</p>
          <p className="mt-3 text-white/80">
            The website is running, but it is not connected to Supabase yet.
          </p>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-white/70">
            <li>Copy the file <code className="text-white">.env.example</code> to <code className="text-white">.env.local</code>.</li>
            <li>Paste your Supabase <strong>Project URL</strong> and <strong>anon key</strong> into it.</li>
            <li>Stop the server (Ctrl + C) and start it again with <code className="text-white">npm run dev</code>.</li>
          </ol>
          <p className="mt-4 text-sm text-white/50">Full instructions are in README.md.</p>
        </div>
      </main>
    );
  }

  const settings = await getSettings();
  const ig = instagramLinks(settings.instagram_username);

  return (
    <>
      <Navbar instagramProfile={ig.profile} />
      <main>{children}</main>
      <Footer settings={settings} />
      <FloatingInstagram href={ig.profile} />
    </>
  );
}
