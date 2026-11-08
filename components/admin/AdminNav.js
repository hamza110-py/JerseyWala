'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: '▦' },
  { href: '/admin/products', label: 'All Products', icon: '☰' },
  { href: '/admin/products/new', label: 'Add Product', icon: '＋' },
  { href: '/admin/orders', label: 'Orders', icon: '✉' },
  { href: '/admin/categories', label: 'Categories', icon: '◫' },
  { href: '/admin/settings', label: 'Store Settings', icon: '⚙' },
];

export default function AdminNav({ email }) {
  const pathname = usePathname();
  const router = useRouter();

  function isActive(href) {
    if (href === '/admin') return pathname === '/admin';
    if (href === '/admin/products') {
      return pathname === '/admin/products' || (pathname.startsWith('/admin/products/') && pathname !== '/admin/products/new');
    }
    return pathname === href;
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <aside className="border-b border-line bg-charcoal lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between px-4 py-3 lg:block lg:px-6 lg:py-6">
        <Link href="/admin" className="font-heading text-xl font-bold leading-none">
          Jersey <span className="text-brand">Wala</span>
          <span className="mt-1 block text-[10px] font-semibold tracking-[0.3em] text-white/40">ADMIN</span>
        </Link>
        <Link href="/" target="_blank" className="text-xs text-white/50 hover:text-white lg:mt-4 lg:inline-block">
          View website ↗
        </Link>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-4 lg:pb-0">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              isActive(item.href) ? 'bg-brand text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span aria-hidden="true" className="w-4 text-center">{item.icon}</span>
            {item.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={logout}
          className="flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
        >
          <span aria-hidden="true" className="w-4 text-center">⏻</span>
          Logout
        </button>
      </nav>

      <p className="hidden truncate px-6 pt-6 text-xs text-white/30 lg:block">{email}</p>
    </aside>
  );
}
