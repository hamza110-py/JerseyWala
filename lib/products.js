import { createPublicClient } from '@/lib/supabase/public';
import { effectivePrice } from '@/lib/utils';

const SELECT = '*, categories(id, name, slug)';

export async function getCategories() {
  const sb = createPublicClient();
  const { data } = await sb.from('categories').select('id, name, slug').order('name');
  return data || [];
}

export async function getClubs() {
  const sb = createPublicClient();
  const { data } = await sb.from('products').select('club').eq('is_published', true);
  const counts = {};
  (data || []).forEach((row) => {
    const club = (row.club || '').trim();
    if (club) counts[club] = (counts[club] || 0) + 1;
  });
  return Object.keys(counts)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ name, count: counts[name] }));
}

export async function getCountries() {
  const sb = createPublicClient();
  const { data } = await sb.from('products').select('country').eq('is_published', true);
  const counts = {};
  (data || []).forEach((row) => {
    const country = (row.country || '').trim();
    if (country) counts[country] = (counts[country] || 0) + 1;
  });
  return Object.keys(counts)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ name, count: counts[name] }));
}

export async function listProducts({ q, categoryId, club, country, sort = 'newest', flag, limit } = {}) {
  const sb = createPublicClient();
  let query = sb.from('products').select(SELECT).eq('is_published', true);

  if (flag) query = query.eq(flag, true);
  if (categoryId) query = query.eq('category_id', categoryId);
  if (club) query = query.eq('club', club);
  if (country) query = query.eq('country', country);
  if (q) {
    const safe = String(q).replace(/[,()%*\\]/g, ' ').trim();
    if (safe) query = query.or(`name.ilike.%${safe}%,club.ilike.%${safe}%,country.ilike.%${safe}%`);
  }

  query = query.order('created_at', { ascending: false });
  if (limit && sort === 'newest') query = query.limit(limit);

  const { data } = await query;
  let list = data || [];

  if (sort === 'price-asc') list = [...list].sort((a, b) => effectivePrice(a) - effectivePrice(b));
  if (sort === 'price-desc') list = [...list].sort((a, b) => effectivePrice(b) - effectivePrice(a));
  if (limit) list = list.slice(0, limit);
  return list;
}

export async function getProductBySlug(slug) {
  const sb = createPublicClient();
  const { data } = await sb
    .from('products')
    .select(SELECT)
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();
  return data || null;
}
