'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { prepareImage } from '@/lib/image';
import { cleanInstagramUsername, storagePathFromUrl } from '@/lib/utils';

const BLANK = {
  instagram_username: '',
  email: '',
  phone: '',
  whatsapp: '',
  address: '',
  slogan: 'Wear Your Passion.',
  facebook_url: '',
  tiktok_url: '',
  youtube_url: '',
  about_text: '',
  hero_image_url: '',
};

function Field({ id, label, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-white/40">{hint}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const [form, setForm] = useState(BLANK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const oldHeroPath = useRef(null);

  const set = (key, value) => {
    setSaved(false);
    setForm((f) => ({ ...f, [key]: value }));
  };

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data, error: loadError }) => {
        if (loadError) setError(loadError.message);
        if (data) {
          const next = { ...BLANK };
          Object.keys(BLANK).forEach((k) => {
            if (data[k] != null) next[k] = data[k];
          });
          setForm(next);
        }
        setLoading(false);
      });
  }, []);

  async function uploadHero(file) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return setError('Please choose a JPG, PNG or WEBP picture.');
    }
    setUploading(true);
    setError('');
    const supabase = createClient();
    try {
      const { blob, type, ext } = await prepareImage(file, 2200);
      const path = `site/hero-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(path, blob, { contentType: type, cacheControl: '31536000' });
      if (uploadError) throw new Error(uploadError.message);

      const oldPath = storagePathFromUrl(form.hero_image_url);
      const url = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
      set('hero_image_url', url);
      // the old hero picture is cleaned up after you press Save
      if (oldPath) oldHeroPath.current = oldPath;
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    }
    setUploading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    const supabase = createClient();
    const payload = {
      ...form,
      id: 1,
      instagram_username: cleanInstagramUsername(form.instagram_username),
      email: form.email.trim(),
      phone: form.phone.trim(),
      whatsapp: form.whatsapp.trim(),
      address: form.address.trim(),
      slogan: form.slogan.trim() || 'Wear Your Passion.',
    };
    const { error: saveError } = await supabase.from('store_settings').upsert(payload);
    setSaving(false);
    if (saveError) return setError(saveError.message);

    if (oldHeroPath.current) {
      await supabase.storage.from('product-images').remove([oldHeroPath.current]);
      oldHeroPath.current = null;
    }
    setForm((f) => ({ ...f, instagram_username: payload.instagram_username }));
    setSaved(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (loading) return <p className="text-white/60">Loading settings…</p>;

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-heading text-3xl font-bold">Store Settings</h1>

      {saved && (
        <p role="status" className="rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          ✅ Settings saved. Your website is updated.
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg border border-brand/50 bg-brand/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <section className="card space-y-4 p-5 sm:p-6">
        <h2 className="font-heading text-lg font-semibold">Instagram ordering</h2>
        <Field
          id="ig"
          label="Instagram username"
          hint="Customers are sent to https://www.instagram.com/your-username/. Just the username (or paste the full link). Example: jers10ywala"
        >
          <input id="ig" className="input" value={form.instagram_username} onChange={(e) => set('instagram_username', e.target.value)} placeholder="jers10ywala" />
        </Field>
      </section>

      <section className="card space-y-4 p-5 sm:p-6">
        <h2 className="font-heading text-lg font-semibold">Brand &amp; contact</h2>
        <Field id="slogan" label="Store slogan">
          <input id="slogan" className="input" value={form.slogan} onChange={(e) => set('slogan', e.target.value)} />
        </Field>
        <Field id="email" label="Brand email">
          <input id="email" type="email" className="input" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="hello@example.com" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="phone" label="Phone number">
            <input id="phone" className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+92 300 1234567" />
          </Field>
          <Field id="wa" label="WhatsApp number" hint="Include the country code, e.g. +92300…">
            <input id="wa" className="input" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="+92 300 1234567" />
          </Field>
        </div>
        <Field id="address" label="Address / city">
          <input id="address" className="input" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Multan, Pakistan" />
        </Field>
      </section>

      <section className="card space-y-4 p-5 sm:p-6">
        <h2 className="font-heading text-lg font-semibold">Social media links</h2>
        <Field id="fb" label="Facebook page link">
          <input id="fb" type="url" className="input" value={form.facebook_url} onChange={(e) => set('facebook_url', e.target.value)} placeholder="https://facebook.com/…" />
        </Field>
        <Field id="tt" label="TikTok link">
          <input id="tt" type="url" className="input" value={form.tiktok_url} onChange={(e) => set('tiktok_url', e.target.value)} placeholder="https://tiktok.com/@…" />
        </Field>
        <Field id="yt" label="YouTube link">
          <input id="yt" type="url" className="input" value={form.youtube_url} onChange={(e) => set('youtube_url', e.target.value)} placeholder="https://youtube.com/@…" />
        </Field>
      </section>

      <section className="card space-y-4 p-5 sm:p-6">
        <h2 className="font-heading text-lg font-semibold">Home page &amp; About page</h2>
        <Field id="hero" label="Home page hero picture" hint="A wide, dark jersey photo works best. Leave empty to use the default red glow design.">
          {form.hero_image_url && (
            <div className="mb-3 overflow-hidden rounded-lg border border-line">
              <img src={form.hero_image_url} alt="Hero preview" className="h-40 w-full object-cover" />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <label className="btn-ghost cursor-pointer">
              {uploading ? 'Uploading…' : form.hero_image_url ? 'Change picture' : 'Upload picture'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={uploading}
                onChange={(e) => {
                  uploadHero(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </label>
            {form.hero_image_url && (
              <button type="button" onClick={() => set('hero_image_url', '')} className="btn border border-brand/40 text-red-300 hover:bg-brand/20">
                Remove picture
              </button>
            )}
          </div>
        </Field>
        <Field id="about" label="About page text" hint="Leave a blank line between paragraphs. Leave empty to use the default text.">
          <textarea id="about" rows={8} className="input" value={form.about_text} onChange={(e) => set('about_text', e.target.value)} />
        </Field>
      </section>

      <button type="submit" disabled={saving || uploading} className="btn-red w-full py-4 text-base uppercase tracking-wider">
        {saving ? 'Saving…' : 'Save Settings'}
      </button>
    </form>
  );
}
