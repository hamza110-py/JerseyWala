'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { slugify } from '@/lib/utils';

export default function CategoriesPage() {
  const [categories, setCategories] = useState(null);
  const [counts, setCounts] = useState({});
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const supabase = createClient();
    const [cats, prods] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('products').select('category_id'),
    ]);
    if (cats.error) setError(cats.error.message);
    const c = {};
    (prods.data || []).forEach((p) => {
      if (p.category_id) c[p.category_id] = (c[p.category_id] || 0) + 1;
    });
    setCounts(c);
    setCategories(cats.data || []);
  }

  useEffect(() => {
    load();
  }, []);

  function friendly(err) {
    return err.code === '23505' ? 'A category with that name already exists.' : err.message;
  }

  async function addCategory(e) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const slug = slugify(name);
    if (!slug) return setError('Please use letters or numbers in the name.');
    setBusy(true);
    setError('');
    const supabase = createClient();
    const { error: insertError } = await supabase.from('categories').insert({ name, slug });
    setBusy(false);
    if (insertError) return setError(friendly(insertError));
    setNewName('');
    load();
  }

  async function saveEdit(id) {
    const name = editName.trim();
    if (!name) return;
    const slug = slugify(name);
    setBusy(true);
    setError('');
    const supabase = createClient();
    const { error: updateError } = await supabase.from('categories').update({ name, slug }).eq('id', id);
    setBusy(false);
    if (updateError) return setError(friendly(updateError));
    setEditingId(null);
    load();
  }

  async function confirmDelete() {
    setBusy(true);
    setError('');
    const supabase = createClient();
    const { error: deleteError } = await supabase.from('categories').delete().eq('id', toDelete.id);
    setBusy(false);
    setToDelete(null);
    if (deleteError) return setError(deleteError.message);
    load();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-heading text-3xl font-bold">Categories</h1>
      <p className="mt-2 text-sm text-white/60">
        Categories group your jerseys in the shop (for example “Club Jerseys” or “Retro Classics”).
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-brand/50 bg-brand/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <form onSubmit={addCategory} className="card mt-6 flex flex-col gap-3 p-4 sm:flex-row">
        <input
          className="input"
          placeholder="New category name…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          aria-label="New category name"
        />
        <button type="submit" disabled={busy || !newName.trim()} className="btn-red shrink-0">
          + Add Category
        </button>
      </form>

      <div className="mt-6 space-y-2">
        {categories === null ? (
          <p className="text-white/50">Loading…</p>
        ) : categories.length === 0 ? (
          <p className="text-white/50">No categories yet.</p>
        ) : (
          categories.map((c) => (
            <div key={c.id} className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
              {editingId === c.id ? (
                <>
                  <input
                    className="input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                    aria-label="Category name"
                  />
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => saveEdit(c.id)} disabled={busy} className="btn-red px-4 py-2">
                      Save
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className="btn-ghost px-4 py-2">
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="min-w-0 flex-1 px-1">
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-xs text-white/40">
                      {counts[c.id] || 0} {(counts[c.id] || 0) === 1 ? 'product' : 'products'}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(c.id);
                        setEditName(c.name);
                      }}
                      className="btn-ghost px-4 py-2"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => setToDelete(c)}
                      className="btn border border-brand/40 px-4 py-2 text-red-300 hover:bg-brand/20"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {toDelete && (
        <ConfirmDialog
          title="Delete this category?"
          message={`“${toDelete.name}” will be removed. Products in it are NOT deleted. They will just have no category.`}
          busy={busy}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
