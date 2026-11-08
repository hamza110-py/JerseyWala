import { getSettings } from '@/lib/settings';
import { instagramLinks } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Contact Us' };

export default async function ContactPage() {
  const settings = await getSettings();
  const ig = instagramLinks(settings.instagram_username);
  const whatsappDigits = String(settings.whatsapp || '').replace(/[^\d]/g, '');

  const items = [
    { label: 'Instagram', value: `@${ig.username}`, href: ig.profile, note: 'Fastest way to reach us' },
    settings.email && { label: 'Email', value: settings.email, href: `mailto:${settings.email}` },
    settings.phone && { label: 'Phone', value: settings.phone, href: `tel:${settings.phone}` },
    whatsappDigits && { label: 'WhatsApp', value: settings.whatsapp, href: `https://wa.me/${whatsappDigits}` },
    settings.address && { label: 'Address', value: settings.address },
    settings.facebook_url && { label: 'Facebook', value: 'Visit our page', href: settings.facebook_url },
    settings.tiktok_url && { label: 'TikTok', value: 'Watch our videos', href: settings.tiktok_url },
    settings.youtube_url && { label: 'YouTube', value: 'Our channel', href: settings.youtube_url },
  ].filter(Boolean);

  return (
    <div className="container-x py-12 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">Get in touch</p>
      <h1 className="font-heading mt-2 text-4xl font-bold sm:text-6xl">Contact Us</h1>
      <p className="mt-4 max-w-xl text-white/65">
        Questions about sizes, stock or delivery? Message us on Instagram and we will get back to you.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {items.map((item) => {
          const external = item.href && item.href.startsWith('http');
          const body = (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">{item.label}</p>
              <p className="mt-2 break-words text-lg font-semibold">{item.value}</p>
              {item.note && <p className="mt-1 text-sm text-white/50">{item.note}</p>}
            </>
          );
          return item.href ? (
            <a
              key={item.label}
              href={item.href}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="card block p-6 transition hover:border-brand"
            >
              {body}
            </a>
          ) : (
            <div key={item.label} className="card p-6">
              {body}
            </div>
          );
        })}
      </div>

      <a href={ig.profile} target="_blank" rel="noopener noreferrer" className="btn-red mt-8 px-8 py-4 uppercase tracking-wider">
        Message us on Instagram
      </a>
    </div>
  );
}
