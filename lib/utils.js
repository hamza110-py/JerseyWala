export const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export const PLACEHOLDER_IMAGE =
  'https://placehold.co/800x1000/1c1c1c/e10600.png?text=Jersey+Wala';

export function formatPKR(value) {
  const n = Number(value || 0);
  return `Rs. ${Math.round(n).toLocaleString('en-US')}`;
}

export function hasDiscount(p) {
  if (!p) return false;
  const sale = Number(p.sale_price);
  return p.sale_price != null && p.sale_price !== '' && sale > 0 && sale < Number(p.price);
}

export function effectivePrice(p) {
  return hasDiscount(p) ? Number(p.sale_price) : Number(p.price);
}

export function discountPercent(p) {
  if (!hasDiscount(p)) return 0;
  return Math.round((1 - Number(p.sale_price) / Number(p.price)) * 100);
}

// A product can be ordered only if it is not marked sold out AND has stock.
export function isAvailable(p) {
  return !p.is_sold_out && Number(p.stock) > 0;
}

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
}

// Accepts "jerseywala.pk", "@jerseywala.pk" or a full instagram.com link.
export function cleanInstagramUsername(value) {
  return String(value || '')
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^@/, '')
    .replace(/[/?#].*$/, '');
}

export function instagramLinks(username) {
  const u = cleanInstagramUsername(username);
  return {
    username: u,
    dm: `https://ig.me/m/${u}`,
    profile: `https://www.instagram.com/${u}/`,
  };
}

// Short reference so you can match an Instagram DM with the order in the admin.
export function makeOrderRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = 'JW-';
  for (let i = 0; i < 5; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// items: [{ name, size, quantity, price }]
export function buildCartMessage(items, ref) {
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const lines = items.map(
    (i, n) =>
      `${n + 1}. ${i.name}\n   Size: ${i.size || 'Standard'} | Qty: ${i.quantity} | Price: ${formatPKR(i.price)} | Subtotal: ${formatPKR(i.price * i.quantity)}`
  );
  return [
    'Hello Jersey Wala! I would like to order:',
    '',
    ...lines,
    '',
    `TOTAL: ${formatPKR(total)}`,
    `Order ref: ${ref}`,
    '',
    'Please confirm availability and delivery details.',
  ].join('\n');
}

// Turns a public image URL back into its path inside the "product-images" bucket.
export function storagePathFromUrl(url) {
  const marker = '/product-images/';
  const s = String(url || '');
  const i = s.indexOf(marker);
  if (i === -1) return null; // external / placeholder image: nothing to delete
  return decodeURIComponent(s.slice(i + marker.length).split('?')[0]);
}

export function parseSpecs(text) {
  return String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(':');
      if (idx === -1) return { label: '', value: line };
      return { label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() };
    });
}
