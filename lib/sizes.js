// ONE place that decides what a "size" is and how sizes and per-size stock are read.
// The admin form (saving) and the storefront (showing) both use these functions,
// so they can never disagree.

export const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

// Accepts an array like ['m', ' L '] or a Postgres-style string like '{M,L,XL}'.
// Returns only valid sizes, upper-case, no duplicates, always in S, M, L, XL, XXL order.
export function normalizeSizes(value) {
  let list = [];
  if (Array.isArray(value)) {
    list = value;
  } else if (typeof value === 'string') {
    list = value.replace(/^\{|\}$/g, '').split(',');
  }
  const cleaned = list.map((s) => String(s).replace(/["']/g, '').trim().toUpperCase());
  return SIZES.filter((s) => cleaned.includes(s));
}

// size_stock is saved as {"M": 5, "L": 0}. Returns a clean object limited to the given sizes.
export function normalizeSizeStock(value, sizes) {
  let source = value;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch (e) {
      source = {};
    }
  }
  if (!source || typeof source !== 'object' || Array.isArray(source)) source = {};
  const out = {};
  sizes.forEach((s) => {
    if (source[s] !== undefined && source[s] !== null && source[s] !== '') {
      const n = parseInt(source[s], 10);
      out[s] = Number.isNaN(n) || n < 0 ? 0 : n;
    }
  });
  return out;
}

// What the storefront shows: ONLY the sizes the admin selected, each with its own stock.
//  - a size with its own stock number uses it
//  - older products without per-size numbers fall back to the product's total stock
//  - sold-out products have every size unavailable
export function getSizeOptions(product) {
  const sizes = normalizeSizes(product.sizes);
  const sizeStock = normalizeSizeStock(product.size_stock, sizes);
  const total = Math.max(0, Number(product.stock) || 0);
  return sizes.map((size) => {
    const hasOwn = Object.prototype.hasOwnProperty.call(sizeStock, size);
    const stock = hasOwn ? sizeStock[size] : total;
    return { size, stock, available: !product.is_sold_out && stock > 0 };
  });
}

// Used by the admin form when an older product has only one total stock number:
// spread it over the selected sizes so the total stays the same.
export function splitStock(total, sizes) {
  const out = {};
  const n = sizes.length;
  if (n === 0) return out;
  const t = Math.max(0, parseInt(total, 10) || 0);
  const base = Math.floor(t / n);
  let rest = t - base * n;
  sizes.forEach((s) => {
    out[s] = base + (rest > 0 ? 1 : 0);
    if (rest > 0) rest -= 1;
  });
  return out;
}

export function sumStock(sizeStock, sizes) {
  return sizes.reduce((sum, s) => sum + (parseInt(sizeStock[s], 10) || 0), 0);
}
