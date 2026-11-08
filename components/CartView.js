'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Copy, Instagram, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCart } from '@/components/CartProvider';
import { createClient } from '@/lib/supabase/client';
import { PLACEHOLDER_IMAGE, buildCartMessage, formatPKR, makeOrderRef } from '@/lib/utils';

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    // fall through
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (e) {
    return false;
  }
}

export default function CartView({ instagramProfile, instagramUsername }) {
  const { items, ready, total, setQuantity, removeItem, clear } = useCart();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [ref, setRef] = useState('');
  const [copied, setCopied] = useState(false);
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | failed

  function handleOrder() {
    const orderRef = makeOrderRef();
    const text = buildCartMessage(items, orderRef);
    setRef(orderRef);
    setMessage(text);
    setCopied(false);
    setOpen(true);

    // Must happen straight inside the click so browsers allow it.
    copyText(text).then(setCopied);
    window.open(instagramProfile, '_blank', 'noopener,noreferrer');

    // Save an enquiry (status: pending) so it appears in Admin -> Orders.
    // This is only a record for the store owner. The order is NOT sent or confirmed
    // until the customer sends the message on Instagram.
    setSaveState('saving');
    try {
      createClient()
        .rpc('place_order', {
          p_items: items.map((i) => ({ product_id: i.id, size: i.size, quantity: i.quantity })),
          p_ref: orderRef,
        })
        .then(({ error }) => setSaveState(error ? 'failed' : 'saved'))
        .catch(() => setSaveState('failed'));
    } catch (e) {
      setSaveState('failed');
    }
  }

  async function handleCopyAgain() {
    setCopied(await copyText(message));
  }

  if (!ready) {
    return <p className="text-white/50">Loading your cart…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="card mx-auto max-w-lg p-10 text-center">
        <ShoppingBag size={40} className="mx-auto text-white/30" aria-hidden="true" />
        <p className="font-heading mt-4 text-2xl font-bold">Your cart is empty</p>
        <p className="mt-2 text-white/60">Find your favourite club and add a jersey.</p>
        <Link href="/shop" className="btn-red mt-6">
          Explore Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        {items.map((item) => (
          <div key={item.key} className="card flex gap-4 p-3 sm:p-4">
            <Link href={`/product/${item.slug}`} className="shrink-0">
              <img
                src={item.image || PLACEHOLDER_IMAGE}
                alt={item.name}
                className="h-28 w-24 rounded-lg object-cover sm:h-32 sm:w-28"
              />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link href={`/product/${item.slug}`} className="line-clamp-2 font-semibold hover:text-brand">
                    {item.name}
                  </Link>
                  <p className="mt-1 text-sm text-white/50">Size: {item.size}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.key)}
                  aria-label={`Remove ${item.name}`}
                  className="shrink-0 rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-red-300"
                >
                  <Trash2 size={18} aria-hidden="true" />
                </button>
              </div>
              <div className="mt-auto flex items-end justify-between pt-3">
                <div className="inline-flex items-center rounded-lg border border-line bg-charcoal">
                  <button
                    type="button"
                    onClick={() => setQuantity(item.key, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    aria-label="Decrease quantity"
                    className="flex h-9 w-9 items-center justify-center hover:text-brand disabled:opacity-30"
                  >
                    <Minus size={16} aria-hidden="true" />
                  </button>
                  <span className="w-9 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(item.key, item.quantity + 1)}
                    disabled={item.quantity >= (item.maxQty || 10)}
                    aria-label="Increase quantity"
                    className="flex h-9 w-9 items-center justify-center hover:text-brand disabled:opacity-30"
                  >
                    <Plus size={16} aria-hidden="true" />
                  </button>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/40">{formatPKR(item.price)} each</p>
                  <p className="font-semibold">{formatPKR(item.price * item.quantity)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
        <button type="button" onClick={clear} className="text-sm text-white/50 underline hover:text-white">
          Clear cart
        </button>
      </div>

      <aside className="card h-fit p-6 lg:sticky lg:top-24">
        <h2 className="font-heading text-xl font-semibold">Order summary</h2>
        <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
          <span className="text-white/70">Total</span>
          <span className="font-heading text-3xl font-bold">{formatPKR(total)}</span>
        </div>
        <p className="mt-2 text-xs text-white/40">Delivery charges (if any) are confirmed with you on Instagram.</p>

        <button type="button" onClick={handleOrder} className="btn-red mt-6 w-full py-4 text-base uppercase tracking-wider">
          <Instagram size={18} aria-hidden="true" />
          Order via Instagram
        </button>
        <a
          href={instagramProfile}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline mt-3 w-full py-3.5 uppercase tracking-wider"
        >
          Message us on Instagram
        </a>
        <p className="mt-4 text-xs leading-relaxed text-white/50">
          No online payment. Tapping the button prepares your order details. Your order is only placed once you send them
          to us in an Instagram message.
        </p>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Send your order on Instagram"
        >
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-line bg-charcoal p-6 sm:rounded-2xl">
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-heading text-2xl font-bold">One last step!</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-line hover:border-white/50"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <p className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              <strong>Your order is not sent yet.</strong> Paste the details below into an Instagram message to us and press
              Send. We confirm availability and delivery there.
            </p>

            <ol className="mt-4 space-y-1.5 text-sm text-white/80">
              <li>
                <span className="font-semibold text-brand">1.</span> Order details{' '}
                {copied ? <span className="font-semibold text-green-400">copied ✓</span> : 'are ready. Tap “Copy order details”.'}
              </li>
              <li>
                <span className="font-semibold text-brand">2.</span> Open our Instagram (@{instagramUsername}) and tap{' '}
                <strong>Message</strong>.
              </li>
              <li>
                <span className="font-semibold text-brand">3.</span> <strong>Paste</strong> the details and press{' '}
                <strong>Send</strong>.
              </li>
            </ol>

            <textarea
              readOnly
              value={message}
              rows={10}
              onFocus={(e) => e.target.select()}
              className="input mt-4 resize-none font-mono text-xs leading-relaxed"
              aria-label="Order details"
            />

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={handleCopyAgain} className="btn-ghost">
                <Copy size={16} aria-hidden="true" />
                {copied ? 'Copied ✓ (copy again)' : 'Copy order details'}
              </button>
              <a href={instagramProfile} target="_blank" rel="noopener noreferrer" className="btn-red">
                <Instagram size={16} aria-hidden="true" />
                Open Instagram
              </a>
            </div>

            <p className="mt-4 text-center text-xs text-white/40">
              Order ref: {ref}
              {saveState === 'saved' && ' · saved as pending'}
              {saveState === 'failed' && ' · could not be saved on our side, but you can still send it on Instagram'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
