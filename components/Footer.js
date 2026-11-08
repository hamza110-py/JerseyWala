import Link from 'next/link';
import { Facebook, Instagram, Youtube } from 'lucide-react';
import { instagramLinks } from '@/lib/utils';

export default function Footer({ settings }) {
  const ig = instagramLinks(settings.instagram_username);
  const whatsappDigits = String(settings.whatsapp || '').replace(/[^\d]/g, '');

  const socials = [
    { label: 'Instagram', href: ig.profile, icon: Instagram },
    settings.facebook_url && { label: 'Facebook', href: settings.facebook_url, icon: Facebook },
    settings.youtube_url && { label: 'YouTube', href: settings.youtube_url, icon: Youtube },
    settings.tiktok_url && { label: 'TikTok', href: settings.tiktok_url },
    whatsappDigits && { label: 'WhatsApp', href: `https://wa.me/${whatsappDigits}` },
  ].filter(Boolean);

  return (
    <footer className="mt-24 border-t border-line bg-charcoal">
      <div className="container-x grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-heading text-3xl font-bold">
            Jersey <span className="text-brand">Wala</span>
          </p>
          <p className="font-heading mt-2 text-lg text-brand">{settings.slogan}</p>
          <p className="mt-4 max-w-sm text-sm text-white/60">
            Every club has a story. Every jersey has an identity. Order in minutes through Instagram.
          </p>
        </div>

        <div>
          <p className="font-heading mb-4 text-sm tracking-widest text-white/50">Explore</p>
          <ul className="space-y-2 text-sm">
            <li><Link className="text-white/80 hover:text-white" href="/shop">Shop</Link></li>
            <li><Link className="text-white/80 hover:text-white" href="/cart">Cart</Link></li>
            <li><Link className="text-white/80 hover:text-white" href="/about">About</Link></li>
            <li><Link className="text-white/80 hover:text-white" href="/contact">Contact</Link></li>
            <li><Link className="text-white/80 hover:text-white" href="/privacy">Privacy Policy</Link></li>
          </ul>
        </div>

        <div>
          <p className="font-heading mb-4 text-sm tracking-widest text-white/50">Contact</p>
          <ul className="space-y-2 text-sm text-white/80">
            <li>
              <a className="hover:text-white" href={ig.profile} target="_blank" rel="noopener noreferrer">
                @{ig.username}
              </a>
            </li>
            {settings.email && (
              <li><a className="hover:text-white" href={`mailto:${settings.email}`}>{settings.email}</a></li>
            )}
            {settings.phone && (
              <li><a className="hover:text-white" href={`tel:${settings.phone}`}>{settings.phone}</a></li>
            )}
            {settings.address && <li className="text-white/60">{settings.address}</li>}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-white/80 transition hover:border-brand hover:text-white"
              >
                {s.icon && <s.icon size={14} aria-hidden="true" />}
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-white/40">
        © {new Date().getFullYear()} Jersey Wala. All rights reserved. Jerseys are sold as fan merchandise and are not affiliated with any club or federation.
      </div>
    </footer>
  );
}
