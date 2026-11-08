import Link from 'next/link';
import { getSettings, DEFAULT_ABOUT } from '@/lib/settings';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'About Us' };

export default async function AboutPage() {
  const settings = await getSettings();
  const about = settings.about_text || DEFAULT_ABOUT;
  const paragraphs = about.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="container-x py-12 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">Our story</p>
      <h1 className="font-heading mt-2 max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">
        Built on <span className="text-brand">passion</span> for the beautiful game.
      </h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        <div className="space-y-5 text-lg leading-relaxed text-white/75 lg:col-span-2">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <aside className="card h-fit p-6">
          <p className="font-heading text-xl font-semibold">{settings.slogan}</p>
          <p className="mt-2 text-sm text-white/60">
            Ready to find your next jersey? Browse the collection and order in minutes on Instagram.
          </p>
          <Link href="/shop" className="btn-red mt-5 w-full">Shop Now</Link>
        </aside>
      </div>
    </div>
  );
}
