'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { formatPKR } from '@/lib/utils';

const STATUSES = [
  { value: 'pending', label: 'Pending', tone: 'bg-amber-500/20 text-amber-300' },
  { value: 'confirmed', label: 'Confirmed', tone: 'bg-blue-500/20 text-blue-300' },
  { value: 'shipped', label: 'Shipped', tone: 'bg-purple-500/20 text-purple-300' },
  { value: 'delivered', label: 'Delivered', tone: 'bg-green-500/20 text-green-300' },
  { value: 'cancelled', label: 'Cancelled', tone: 'bg-red-500/20 text-red-300' },
];

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState(null);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data, error: loadError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });
    if (loadError) setError(loadError.message);
    setOrders(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    const c = { all: (orders || []).length };
    STATUSES.forEach((s) => (c[s.value] = (orders || []).filter((o) => o.status === s.value).length));
    return c;
  }, [orders]);

  const visible = (orders || []).filter((o) => filter === 'all' || o.status === filter);

  async function changeStatus(order, status) {
    setError('');
    const supabase = createClient();
    const { error: updateError } = await supabase.from('orders').update({ status }).eq('id', order.id);
    if (updateError) return setError(updateError.message);
    setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, status } : o)));
  }

  async function confirmDelete() {
    setBusy(true);
    const supabase = createClient();
    const { error: deleteError } = await supabase.from('orders').delete().eq('id', toDelete.id);
    setBusy(false);
    if (deleteError) setError(deleteError.message);
    else setOrders((list) => list.filter((o) => o.id !== toDelete.id));
    setToDelete(null);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-heading text-3xl font-bold">Orders</h1>
      <p className="mt-2 text-sm text-white/60">
        Each time a customer taps “Order via Instagram” on the cart page, a <strong>Pending</strong> enquiry appears here.
        It is <strong>not a confirmed sale</strong>. Find their Instagram message (it contains the same{' '}
        <strong>Order ref</strong>), agree the details with them, then set the status to <strong>Confirmed</strong>.
        Confirmed lowers stock automatically; Cancelled puts it back. Enquiries that never reach Instagram simply stay Pending.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-brand/50 bg-brand/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {[{ value: 'all', label: 'All' }, ...STATUSES].map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setFilter(s.value)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              filter === s.value ? 'border-brand bg-brand text-white' : 'border-line text-white/70 hover:border-white/50'
            }`}
          >
            {s.label} ({counts[s.value] || 0})
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {orders === null ? (
          <p className="text-white/50">Loading…</p>
        ) : visible.length === 0 ? (
          <div className="card p-8 text-center text-white/60">No orders here yet.</div>
        ) : (
          visible.map((o) => {
            const status = STATUSES.find((s) => s.value === o.status) || STATUSES[0];
            return (
              <div key={o.id} className="card p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-heading text-lg font-bold">#{o.order_number}</span>
                    <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-xs">{o.reference}</span>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${status.tone}`}>{status.label}</span>
                    <span className="text-xs text-white/40">{formatDate(o.created_at)}</span>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <select
                      value={o.status}
                      onChange={(e) => changeStatus(o, e.target.value)}
                      className="input w-40"
                      aria-label={`Status for order ${o.order_number}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setToDelete(o)}
                      className="btn border border-brand/40 px-4 py-2 text-red-300 hover:bg-brand/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-charcoal text-sm">
                  {(o.order_items || []).map((item) => (
                    <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                      <span className="font-medium">{item.product_name}</span>
                      <span className="text-white/60">
                        Size {item.size || '–'} · Qty {item.quantity} · {formatPKR(item.unit_price)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-right text-sm">
                  Total <span className="font-heading text-xl font-bold">{formatPKR(o.total)}</span>
                </p>
              </div>
            );
          })
        )}
      </div>

      {toDelete && (
        <ConfirmDialog
          title="Delete this order?"
          message={`Order #${toDelete.order_number} (${toDelete.reference}) will be removed permanently. Stock is not changed by deleting.`}
          busy={busy}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
