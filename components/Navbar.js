'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Instagram, Menu, ShoppingBag, X } from 'lucide-react';
import { useCart } from '@/components/CartProvider';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar({ instagramProfile }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { count } = useCart();

  const isActive = (href) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur-md">
      <div className="container-x flex h-16 items-center justify-between">
        <Link href="/" className="font-heading text-2xl font-bold leading-none" onClick={() => setOpen(false)}>
          Jersey <span className="text-brand">Wala</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium uppercase tracking-wider transition hover:text-white ${
                isActive(l.href) ? 'text-white' : 'text-white/60'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={instagramProfile}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Our Instagram"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-white/80 transition hover:border-brand hover:text-white"
          >
            <Instagram size={19} aria-hidden="true" />
          </a>
          <Link
            href="/cart"
            aria-label={`Cart, ${count} items`}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-line text-white/80 transition hover:border-brand hover:text-white"
          >
            <ShoppingBag size={19} aria-hidden="true" />
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
          <Link href="/shop" className="btn-red hidden px-4 py-2 sm:inline-flex">
            Shop Now
          </Link>
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-line md:hidden"
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-line bg-charcoal md:hidden" aria-label="Mobile">
          <div className="container-x flex flex-col py-2">
            {[...LINKS, { href: '/cart', label: 'Cart' }].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`border-b border-line/60 py-3 text-sm font-medium uppercase tracking-wider ${
                  isActive(l.href) ? 'text-brand' : 'text-white/80'
                }`}
              >
                {l.label}
              </Link>
            ))}
            <a
              href={instagramProfile}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 text-sm font-medium uppercase tracking-wider text-white/80"
            >
              Instagram
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
