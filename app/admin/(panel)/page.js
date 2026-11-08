'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { PLACEHOLDER_IMAGE, formatPKR, effectivePrice, isAvailable } from '@/lib/utils';

function Stat({ label, value, tone = 'text-white' }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-white/50">{label}</p>
      <p className={`font-heading mt-2 text-4xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function Row({ p }) {
  return (
    <Link
      href={`/admin/products/${p.id}`}
      className="flex items-center gap-3 rounded-lg border border-line bg-charcoal p-2.5 transition hover:border-brand"
    >
      <img src={p.images?.[0] || PLACEHOLDER_IMAGE} alt="" className="h-14 w-12 rounded object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{p.name}</p>
        <p className="truncate text-xs text-white/50">
          {p.club || 'No club'} · {formatPKR(effectivePrice(p))}
        </p>
      </div>
      <span className="text-xs font-semibold text-white/50">Edit →</span>
    </Link>
  );
}

export default function DashboardPage() {
  const [products, setProducts] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [newOrders, setNewOrders] = useState(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .then(({ count }) => setNewOrders(count || 0));
    supabase
      .from('products')
      .select('id, name, club, price, sale_price, stock, is_sold_out, is_featured, is_published, images, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error: loadError }) => {
        if (loadError) setError(loadError.message);
        setProducts(data || []);
      });
  }, []);

  const stats = useMemo(() => {
    const list = products || [];
    return {
      total: list.length,
      available: list.filter((p) => p.is_published && isAvailable(p)).length,
      out: list.filter((p) => !isAvailable(p)).length,
      featured: list.filter((p) => p.is_featured).length,
    };
  }, [products]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return (products || [])
      .filter((p) => `${p.name} ${p.club}`.toLowerCase().includes(q))
      .slice(0, 8);
  }, [products, query]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-bold">Dashboard</h1>
        <Link href="/admin/products/new" className="btn-red">
          + Add New Product
        </Link>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-brand/50 bg-brand/10 px-4 py-3 text-sm text-red-300">
          Could not load products: {error}. Check that you ran the database setup (schema.sql) and made yourself an admin.
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total products" value={products ? stats.total : '–'} />
        <Stat label="Available" value={products ? stats.available : '–'} tone="text-green-400" />
        <Stat label="Out of stock" value={products ? stats.out : '–'} tone="text-red-400" />
        <Stat label="Featured" value={products ? stats.featured : '–'} tone="text-amber-400" />
      </div>

      <Link
        href="/admin/orders"
        className="card mt-4 flex items-center justify-between p-5 transition hover:border-brand"
      >
        <span>
          <span className="block text-xs font-semibold uppercase tracking-wider text-white/50">Pending order enquiries</span>
          <span className="font-heading text-3xl font-bold text-amber-400">{newOrders === null ? '–' : newOrders}</span>
        </span>
        <span className="text-sm font-semibold text-white/60">View orders →</span>
      </Link>

      <div className="card mt-8 p-5">
        <label htmlFor="quick-search" className="label">Quick search</label>
        <input
          id="quick-search"
          type="search"
          className="input"
          placeholder="Type a jersey name or club to find it fast…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query.trim() && (
          <div className="mt-3 space-y-2">
            {results.length === 0 ? (
              <p className="text-sm text-white/50">No products found.</p>
            ) : (
              results.map((p) => <Row key={p.id} p={p} />)
            )}
          </div>
        )}
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold">Recently added</h2>
          <Link href="/admin/products" className="text-sm text-white/60 hover:text-white">
            See all →
          </Link>
        </div>
        {products === null ? (
          <p className="text-white/50">Loading…</p>
        ) : products.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="font-heading text-xl font-bold">No products yet</p>
            <p className="mt-1 text-sm text-white/60">Add your first jersey to get your store started.</p>
            <Link href="/admin/products/new" className="btn-red mt-5">
              + Add your first product
            </Link>
          </div>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {products.slice(0, 6).map((p) => (
              <Row key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
