'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'jerseywala-cart-v1';

// The cart lives in the customer's own browser (no account needed).
export default function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setItems(parsed);
    } catch (e) {
      // storage blocked or corrupted: start with an empty cart
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      // ignore
    }
  }, [items, ready]);

  const addItem = useCallback((item) => {
    // item: { id, slug, name, image, price, size, quantity, maxQty }
    setItems((prev) => {
      const key = `${item.id}__${item.size}`;
      const existing = prev.find((i) => i.key === key);
      const cap = Math.max(1, Math.min(item.maxQty || 10, 10));
      if (existing) {
        return prev.map((i) =>
          i.key === key ? { ...i, price: item.price, quantity: Math.min(i.quantity + item.quantity, cap), maxQty: cap } : i
        );
      }
      return [...prev, { ...item, key, quantity: Math.min(item.quantity, cap), maxQty: cap }];
    });
  }, []);

  const setQuantity = useCallback((key, quantity) => {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxQty || 10)) } : i))
    );
  }, []);

  const removeItem = useCallback((key) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => {
    const count = items.reduce((n, i) => n + i.quantity, 0);
    const total = items.reduce((n, i) => n + i.price * i.quantity, 0);
    return { items, ready, count, total, addItem, setQuantity, removeItem, clear };
  }, [items, ready, addItem, setQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
