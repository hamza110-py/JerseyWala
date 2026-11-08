'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Instagram, ShoppingBag } from 'lucide-react';
import { useCart } from '@/components/CartProvider';

export default function AddToCart({ product, instagramProfile }) {
  const { id, slug, name, image, price, sizes, stock, available } = product;
  const sizeList = sizes && sizes.length > 0 ? sizes : [];
  const maxQty = Math.max(1, Math.min(Number(stock) || 1, 10));
  const { addItem } = useCart();

  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);

  function handleAdd() {
    if (!available) return;
    if (sizeList.length > 0 && !size) {
      setError('Please select a size first.');
      return;
    }
    setError('');
    addItem({ id, slug, name, image, price, size: size || 'Standard', quantity, maxQty });
    setAdded(true);
  }

  return (
    <div>
      {sizeList.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-wider">Size</p>
            {size && <p className="text-sm text-white/60">Selected: {size}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {sizeList.map((s) => (
              <button
                key={s}
                type="button"
                disabled={!available}
                aria-pressed={size === s}
                onClick={() => {
                  setSize(s);
                  setError('');
                  setAdded(false);
                }}
                className={`h-11 min-w-[3.25rem] rounded-lg border px-4 text-sm font-semibold transition disabled:opacity-40 ${
                  size === s
                    ? 'border-brand bg-brand text-white'
                    : 'border-line bg-panel text-white/80 hover:border-white/50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider">Quantity</p>
        <div className="inline-flex items-center rounded-lg border border-line bg-panel">
          <button
            type="button"
            disabled={!available || quantity <= 1}
            onClick={() => {
              setQuantity((q) => Math.max(1, q - 1));
              setAdded(false);
            }}
            className="h-11 w-11 text-xl transition hover:text-brand disabled:opacity-30"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-12 text-center font-semibold" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            disabled={!available || quantity >= maxQty}
            onClick={() => {
              setQuantity((q) => Math.min(maxQty, q + 1));
              setAdded(false);
            }}
            className="h-11 w-11 text-xl transition hover:text-brand disabled:opacity-30"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-brand/50 bg-brand/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleAdd}
        disabled={!available}
        className="btn-red mt-6 w-full py-4 text-base uppercase tracking-wider"
      >
        <ShoppingBag size={18} aria-hidden="true" />
        {available ? 'Add to Cart' : 'Sold Out'}
      </button>

      {added && (
        <div role="status" className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-2.5 text-sm text-green-300">
          <span className="flex items-center gap-2">
            <Check size={16} aria-hidden="true" /> Added to your cart
          </span>
          <Link href="/cart" className="font-semibold underline">
            View cart
          </Link>
        </div>
      )}

      <a
        href={instagramProfile}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-outline mt-3 w-full py-3.5 uppercase tracking-wider"
      >
        <Instagram size={18} aria-hidden="true" />
        Message us on Instagram
      </a>
      {available && (
        <p className="mt-2 text-center text-xs text-white/50">
          Add jerseys to your cart, then finish your order by sending us the details on Instagram.
        </p>
      )}
    </div>
  );
}
