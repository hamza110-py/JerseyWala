'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { PLACEHOLDER_IMAGE, formatPKR, effectivePrice, hasDiscount, isAvailable, storagePathFromUrl } from '@/lib/utils';

export default function AllProductsPage() {
  const [products, setProducts] = useState(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data, error: loadError } = await supabase
      .from('products')
      .select('*, categories(name)')
      .order('created_at', { ascending: false });
    if (loadError) setError(loadError.message);
    setProducts(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products || [];
    return (products || []).filter((p) => `${p.name} ${p.club} ${p.categories?.name || ''}`.toLowerCase().includes(q));
  }, [products, query]);

  async function toggleSoldOut(product) {
    setError('');
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('products')
      .update({ is_sold_out: !product.is_sold_out })
      .eq('id', product.id);
    if (updateError) return setError(updateError.message);
    setProducts((list) => list.map((p) => (p.id === product.id ? { ...p, is_sold_out: !p.is_sold_out } : p)));
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    setError('');
    const supabase = createClient();

    const { error: deleteError } = await supabase.from('products').delete().eq('id', toDelete.id);
    if (deleteError) {
      setError(deleteError.message);
      setDeleting(false);
      setToDelete(null);
      return;
    }

    // Also remove the uploaded photos from storage (placeholder links are skipped).
    const paths = (toDelete.images || []).map(storagePathFromUrl).filter(Boolean);
    if (paths.length > 0) await supabase.storage.from('product-images').remove(paths);

    setProducts((list) => list.filter((p) => p.id !== toDelete.id));
    setDeleting(false);
    setToDelete(null);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-bold">All Products</h1>
        <Link href="/admin/products/new" className="btn-red">
          + Add New Product
        </Link>
      </div>

      <input
        type="search"
        className="input mt-6"
        placeholder="Search by name, club or category…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search products"
      />

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-brand/50 bg-brand/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {products === null ? (
          <p className="text-white/50">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="card p-8 text-center text-white/60">
            {products.length === 0 ? 'No products yet. Click “Add New Product” to start.' : 'No products match your search.'}
          </div>
        ) : (
          filtered.map((p) => {
            const available = isAvailable(p);
            return (
              <div key={p.id} className="card flex flex-col gap-4 p-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <img src={p.images?.[0] || PLACEHOLDER_IMAGE} alt="" className="h-20 w-16 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{p.name}</p>
                    <p className="truncate text-xs text-white/50">
                      {p.club || 'No club'}
                      {p.categories?.name ? ` · ${p.categories.name}` : ''}
                    </p>
                    <p className="mt-1 text-sm">
                      <span className="font-semibold">{formatPKR(effectivePrice(p))}</span>
                      {hasDiscount(p) && <span className="ml-2 text-white/40 line-through">{formatPKR(p.price)}</span>}
                      <span className="ml-3 text-xs text-white/50">Stock: {p.stock}</span>
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${available ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                        {available ? 'In stock' : 'Sold out'}
                      </span>
                      {!p.is_published && <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase text-white/70">Hidden</span>}
                      {p.is_featured && <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300">Featured</span>}
                      {p.is_new_arrival && <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase text-white/70">New</span>}
                      {p.is_best_seller && <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase text-white/70">Best seller</span>}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <Link href={`/admin/products/${p.id}`} className="btn-ghost px-4 py-2">
                    Edit
                  </Link>
                  <button type="button" onClick={() => toggleSoldOut(p)} className="btn-ghost px-4 py-2">
                    {p.is_sold_out ? 'Back in stock' : 'Mark sold out'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setToDelete(p)}
                    className="btn border border-brand/40 px-4 py-2 text-red-300 hover:bg-brand/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {toDelete && (
        <ConfirmDialog
          title="Delete this product?"
          message={`“${toDelete.name}” and its photos will be removed from the website permanently. This cannot be undone. (To just hide it, use Edit and turn off “Visible in the shop”.)`}
          confirmLabel="Yes, delete"
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
