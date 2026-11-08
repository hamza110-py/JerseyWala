'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { prepareImage } from '@/lib/image';
import { SIZES, slugify, storagePathFromUrl } from '@/lib/utils';
import Toggle from '@/components/admin/Toggle';

const EMPTY = {
  name: '',
  description: '',
  specifications: '',
  club: '',
  country: '',
  category_id: '',
  price: '',
  sale_price: '',
  sizes: [...SIZES],
  stock: '10',
  is_sold_out: false,
  is_featured: false,
  is_new_arrival: true,
  is_best_seller: false,
  is_retro: false,
  is_published: true,
};

function Section({ number, title, children }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="font-heading mb-5 flex items-center gap-3 text-lg font-semibold">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-sm">{number}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function ProductForm({ productId }) {
  const isEdit = Boolean(productId);
  const [form, setForm] = useState(EMPTY);
  const [items, setItems] = useState([]); // photos: { key, url?, file?, preview }
  const [originalUrls, setOriginalUrls] = useState([]);
  const [slug, setSlug] = useState('');
  const [categories, setCategories] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null); // { slug, mode }

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const [cats, clubRows] = await Promise.all([
        supabase.from('categories').select('id, name').order('name'),
        supabase.from('products').select('club, country'),
      ]);
      if (cancelled) return;
      setCategories(cats.data || []);
      setClubs([...new Set((clubRows.data || []).map((r) => (r.club || '').trim()).filter(Boolean))].sort());
      setCountries([...new Set((clubRows.data || []).map((r) => (r.country || '').trim()).filter(Boolean))].sort());

      if (isEdit) {
        const { data, error: loadError } = await supabase.from('products').select('*').eq('id', productId).maybeSingle();
        if (cancelled) return;
        if (loadError || !data) {
          setError('Could not find this product. It may have been deleted.');
          setLoading(false);
          return;
        }
        setForm({
          name: data.name || '',
          description: data.description || '',
          specifications: data.specifications || '',
          club: data.club || '',
          country: data.country || '',
          category_id: data.category_id || '',
          price: String(data.price ?? ''),
          sale_price: data.sale_price != null ? String(data.sale_price) : '',
          sizes: data.sizes || [],
          stock: String(data.stock ?? 0),
          is_sold_out: !!data.is_sold_out,
          is_featured: !!data.is_featured,
          is_new_arrival: !!data.is_new_arrival,
          is_best_seller: !!data.is_best_seller,
          is_retro: !!data.is_retro,
          is_published: data.is_published !== false,
        });
        setSlug(data.slug);
        setOriginalUrls(data.images || []);
        setItems((data.images || []).map((url, i) => ({ key: `old-${i}-${url}`, url, preview: url })));
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [isEdit, productId]);

  function addFiles(fileList) {
    const files = Array.from(fileList || []);
    const allowed = files.filter((f) => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type));
    if (allowed.length !== files.length) {
      setError('Only JPG, PNG or WEBP pictures can be uploaded. Some files were skipped.');
    } else {
      setError('');
    }
    setItems((prev) => [
      ...prev,
      ...allowed.map((file) => ({
        key: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        preview: URL.createObjectURL(file),
      })),
    ]);
  }

  function removeItem(key) {
    setItems((prev) => {
      const target = prev.find((i) => i.key === key);
      if (target?.file) URL.revokeObjectURL(target.preview);
      return prev.filter((i) => i.key !== key);
    });
  }

  function makeMain(key) {
    setItems((prev) => {
      const target = prev.find((i) => i.key === key);
      return target ? [target, ...prev.filter((i) => i.key !== key)] : prev;
    });
  }

  function toggleSize(size) {
    setForm((f) => ({
      ...f,
      sizes: f.sizes.includes(size) ? f.sizes.filter((s) => s !== size) : [...f.sizes, size],
    }));
  }

  function fail(message) {
    setError(message);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const name = form.name.trim();
    if (!name) return fail('Please enter the product name.');

    const price = Number(form.price);
    if (!form.price || Number.isNaN(price) || price <= 0) return fail('Please enter a regular price greater than 0.');

    let sale = null;
    if (String(form.sale_price).trim() !== '') {
      sale = Number(form.sale_price);
      if (Number.isNaN(sale) || sale <= 0 || sale >= price) {
        return fail('The sale price must be lower than the regular price. Leave it empty if there is no discount.');
      }
    }

    if (form.sizes.length === 0) return fail('Please select at least one available size.');

    const stock = parseInt(form.stock, 10);
    if (Number.isNaN(stock) || stock < 0) return fail('Please enter a stock quantity (0 or more).');

    setSaving(true);
    const supabase = createClient();
    const id = productId || crypto.randomUUID();
    const uploadedPaths = [];

    try {
      // 1) Upload any new photos
      const finalUrls = [];
      for (const item of items) {
        if (item.file) {
          const { blob, type, ext } = await prepareImage(item.file);
          const path = `${id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(path, blob, { contentType: type, cacheControl: '31536000', upsert: false });
          if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`);
          uploadedPaths.push(path);
          finalUrls.push(supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl);
        } else {
          finalUrls.push(item.url);
        }
      }

      // 2) Save the product
      const row = {
        name,
        description: form.description.trim(),
        specifications: form.specifications.trim(),
        club: form.club.trim(),
        country: form.country.trim(),
        category_id: form.category_id || null,
        price,
        sale_price: sale,
        sizes: SIZES.filter((s) => form.sizes.includes(s)),
        stock,
        is_sold_out: form.is_sold_out,
        is_featured: form.is_featured,
        is_new_arrival: form.is_new_arrival,
        is_best_seller: form.is_best_seller,
        is_retro: form.is_retro,
        is_published: form.is_published,
        images: finalUrls,
      };

      let savedSlug = slug;
      if (isEdit) {
        const { error: updateError } = await supabase.from('products').update(row).eq('id', id);
        if (updateError) throw new Error(updateError.message);
      } else {
        savedSlug = `${slugify(name) || 'jersey'}-${id.slice(0, 6)}`;
        const { error: insertError } = await supabase.from('products').insert({ ...row, id, slug: savedSlug });
        if (insertError) throw new Error(insertError.message);
      }

      // 3) Delete photos that were removed
      const removedPaths = originalUrls
        .filter((url) => !finalUrls.includes(url))
        .map(storagePathFromUrl)
        .filter(Boolean);
      if (removedPaths.length > 0) {
        await supabase.storage.from('product-images').remove(removedPaths);
      }

      // 4) Show success
      items.forEach((i) => i.file && URL.revokeObjectURL(i.preview));
      setItems(finalUrls.map((url, i) => ({ key: `old-${i}-${url}`, url, preview: url })));
      setOriginalUrls(finalUrls);
      setSlug(savedSlug);
      setDone({ slug: savedSlug, mode: isEdit ? 'updated' : 'published' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from('product-images').remove(uploadedPaths);
      }
      fail(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function resetForAnother() {
    setForm(EMPTY);
    setItems([]);
    setOriginalUrls([]);
    setSlug('');
    setDone(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (loading) return <p className="text-white/60">Loading product…</p>;

  if (done) {
    return (
      <div className="card mx-auto max-w-xl p-8 text-center">
        <p className="text-5xl">✅</p>
        <h2 className="font-heading mt-3 text-2xl font-bold">
          {done.mode === 'published' ? 'Product saved!' : 'Changes saved!'}
        </h2>
        <p className="mt-2 text-white/70">
          {form.is_published
            ? 'The website has been updated. Visitors can see it right now.'
            : 'This product is hidden, so visitors cannot see it yet.'}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {form.is_published && (
            <Link href={`/product/${done.slug}`} target="_blank" className="btn-red">
              View on website ↗
            </Link>
          )}
          {isEdit ? (
            <button type="button" onClick={() => setDone(null)} className="btn-ghost">
              Keep editing
            </button>
          ) : (
            <button type="button" onClick={resetForAnother} className="btn-ghost">
              Add another product
            </button>
          )}
          <Link href="/admin/products" className="btn-ghost">
            All products
          </Link>
        </div>
      </div>
    );
  }

  const publishLabel = isEdit ? 'Save Changes' : form.is_published ? 'Publish Product' : 'Save Product (Hidden)';

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
      {error && (
        <p role="alert" className="rounded-lg border border-brand/50 bg-brand/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <Section number="1" title="Basic information">
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="label">Product Name *</label>
            <input
              id="name"
              className="input"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Real Madrid Home Jersey 2025/26"
            />
          </div>
          <div>
            <label htmlFor="description" className="label">Product Description</label>
            <textarea
              id="description"
              rows={4}
              className="input"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Tell customers about the jersey: fabric, fit, season…"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="club" className="label">Club / Team Name</label>
              <input
                id="club"
                list="club-list"
                className="input"
                value={form.club}
                onChange={(e) => set('club', e.target.value)}
                placeholder="e.g. Real Madrid"
              />
              <datalist id="club-list">
                {clubs.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <p className="mt-1 text-xs text-white/40">Type exactly the same spelling each time so jerseys group together.</p>
            </div>
            <div>
              <label htmlFor="category" className="label">Category</label>
              <select
                id="category"
                className="input"
                value={form.category_id}
                onChange={(e) => set('category_id', e.target.value)}
              >
                <option value="">— No category —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-white/40">
                Need a new one? <Link href="/admin/categories" className="underline">Manage categories</Link>
              </p>
            </div>
          </div>
          <div>
            <label htmlFor="country" className="label">Country</label>
            <input
              id="country"
              list="country-list"
              className="input"
              value={form.country}
              onChange={(e) => set('country', e.target.value)}
              placeholder="e.g. Spain, Argentina, Pakistan"
            />
            <datalist id="country-list">
              {countries.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <p className="mt-1 text-xs text-white/40">Used for “Shop by Country”. Use the same spelling each time.</p>
          </div>
          <div>
            <label htmlFor="specs" className="label">Specifications (optional)</label>
            <textarea
              id="specs"
              rows={4}
              className="input font-mono text-xs"
              value={form.specifications}
              onChange={(e) => set('specifications', e.target.value)}
              placeholder={'One per line, like this:\nFabric: Breathable polyester\nFit: Regular\nSeason: 2025/26'}
            />
          </div>
        </div>
      </Section>

      <Section number="2" title="Product photos">
        <p className="mb-4 text-sm text-white/60">
          Upload your real jersey pictures (JPG, PNG or WEBP). The <strong>first</strong> photo is the main photo shown in the shop.
        </p>

        {items.length > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((item, index) => (
              <div key={item.key} className="overflow-hidden rounded-lg border border-line bg-charcoal">
                <div className="relative aspect-[4/5]">
                  <img src={item.preview} alt={`Photo ${index + 1}`} className="h-full w-full object-cover" />
                  {index === 0 && (
                    <span className="absolute left-2 top-2 rounded bg-brand px-2 py-0.5 text-[10px] font-bold uppercase">
                      Main
                    </span>
                  )}
                  {item.file && (
                    <span className="absolute right-2 top-2 rounded bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-black">
                      New
                    </span>
                  )}
                </div>
                <div className="flex gap-1 p-2">
                  {index !== 0 && (
                    <button type="button" onClick={() => makeMain(item.key)} className="flex-1 rounded bg-white/10 px-2 py-1.5 text-xs font-medium hover:bg-white/20">
                      Make main
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeItem(item.key)}
                    className="flex-1 rounded bg-brand/20 px-2 py-1.5 text-xs font-medium text-red-300 hover:bg-brand/40"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-line px-4 py-8 text-center transition hover:border-brand">
          <span className="text-2xl">📷</span>
          <span className="mt-2 text-sm font-semibold">Tap here to choose photos</span>
          <span className="text-xs text-white/40">You can select several at once</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </label>
        {items.length === 0 && (
          <p className="mt-3 text-xs text-white/40">No photos yet. A grey placeholder will be shown on the website until you add one.</p>
        )}
      </Section>

      <Section number="3" title="Price (PKR)">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="price" className="label">Regular Price (PKR) *</label>
            <input
              id="price"
              type="number"
              inputMode="numeric"
              min="0"
              className="input"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              placeholder="4500"
            />
          </div>
          <div>
            <label htmlFor="sale" className="label">Sale Price (PKR)</label>
            <input
              id="sale"
              type="number"
              inputMode="numeric"
              min="0"
              className="input"
              value={form.sale_price}
              onChange={(e) => set('sale_price', e.target.value)}
              placeholder="Leave empty if no discount"
            />
          </div>
        </div>
      </Section>

      <Section number="4" title="Sizes and stock">
        <p className="label">Available Sizes *</p>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleSize(s)}
              aria-pressed={form.sizes.includes(s)}
              className={`h-11 min-w-[3.5rem] rounded-lg border px-4 text-sm font-semibold transition ${
                form.sizes.includes(s) ? 'border-brand bg-brand text-white' : 'border-line bg-charcoal text-white/60 hover:border-white/40'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="mt-5 max-w-xs">
          <label htmlFor="stock" className="label">Stock Quantity</label>
          <input
            id="stock"
            type="number"
            inputMode="numeric"
            min="0"
            className="input"
            value={form.stock}
            onChange={(e) => set('stock', e.target.value)}
          />
          <p className="mt-1 text-xs text-white/40">When stock is 0 the jersey shows as “Sold out” automatically.</p>
        </div>
        <div className="mt-5">
          <Toggle
            checked={form.is_sold_out}
            onChange={(v) => set('is_sold_out', v)}
            label="Mark as sold out"
            hint="Customers cannot order it while this is on."
          />
        </div>
      </Section>

      <Section number="5" title="Show on website">
        <div className="space-y-3">
          <Toggle checked={form.is_featured} onChange={(v) => set('is_featured', v)} label="Featured Product" hint="Appears in “Featured Jerseys” on the home page." />
          <Toggle checked={form.is_new_arrival} onChange={(v) => set('is_new_arrival', v)} label="New Arrival" hint="Appears in “New Arrivals” and gets a NEW badge." />
          <Toggle checked={form.is_best_seller} onChange={(v) => set('is_best_seller', v)} label="Popular Jersey" hint="Appears in “Popular Jerseys” on the home page." />
          <Toggle checked={form.is_retro} onChange={(v) => set('is_retro', v)} label="Retro Jersey" hint="Appears in “Retro Football Jerseys” on the home page." />
          <Toggle checked={form.is_published} onChange={(v) => set('is_published', v)} label="Visible in the shop" hint="Turn off to hide this product without deleting it." />
        </div>
      </Section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="submit" disabled={saving} className="btn-red flex-1 py-4 text-base uppercase tracking-wider">
          {saving ? 'Saving… please wait' : publishLabel}
        </button>
        <Link href="/admin/products" className="btn-ghost py-4">
          Cancel
        </Link>
      </div>
    </form>
  );
}
