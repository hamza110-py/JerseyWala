'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Instagram, ShoppingBag } from 'lucide-react';
import { useCart } from '@/components/CartProvider';

// sizeOptions: [{ size: 'M', stock: 5, available: true }, ...]
// It contains ONLY the sizes the admin selected, already worked out on the server.
export default function AddToCart({ product, instagramProfile }) {
  const { id, slug, name, image, price, sizeOptions = [], stock, available } = product;
  const hasSizes = sizeOptions.length > 0;
  const { addItem } = useCart();

  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);

  const selected = sizeOptions.find((o) => o.size === size);
  // how many the customer may order: the chosen size's stock (or the total if no sizes)
  const limit = selected ? selected.stock : Number(stock) || 0;
  const maxQty = Math.max(1, Math.min(limit || 1, 10));
  const anySoldOut = sizeOptions.some((o) => !o.available);

  function chooseSize(option) {
    if (!option.available) return;
    setSize(option.size);
    setQuantity((q) => Math.min(q, Math.max(1, Math.min(option.stock, 10))));
    setError('');
    setAdded(false);
  }

  function handleAdd() {
    if (!available) return;
    if (hasSizes && !selected) {
      setError('Please select a size first.');
      return;
    }
    if (selected && !selected.available) {
      setError('That size is sold out. Please choose another size.');
      return;
    }
    setError('');
    addItem({
      id,
      slug,
      name,
      image,
      price,
      size: selected ? selected.size : 'Standard',
      quantity: Math.min(quantity, maxQty),
      maxQty,
    });
    setAdded(true);
  }

  return (
    <div>
      {hasSizes && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-wider">Size</p>
            {size && <p className="text-sm text-white/60">Selected: {size}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {sizeOptions.map((o) => {
              const isSelected = size === o.size;
              return (
                <button
                  key={o.size}
                  type="button"
                  disabled={!o.available}
                  aria-pressed={isSelected}
                  aria-label={o.available ? `Size ${o.size}` : `Size ${o.size}, sold out`}
                  title={o.available ? `Size ${o.size}` : `Size ${o.size} is sold out`}
                  onClick={() => chooseSize(o)}
                  className={`h-11 min-w-[3.25rem] rounded-lg border px-4 text-sm font-semibold transition ${
                    !o.available
                      ? 'cursor-not-allowed border-line bg-panel text-white/30 line-through opacity-50'
                      : isSelected
                      ? 'border-brand bg-brand text-white'
                      : 'border-line bg-panel text-white/80 hover:border-white/50'
                  }`}
                >
                  {o.size}
                </button>
              );
            })}
          </div>
          {anySoldOut && <p className="mt-2 text-xs text-white/40">Crossed-out sizes are sold out.</p>}
          {selected && selected.stock <= 5 && (
            <p className="mt-2 text-xs font-semibold text-amber-400">Only {selected.stock} left in size {selected.size}</p>
          )}
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
