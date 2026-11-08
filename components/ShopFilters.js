'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ShopFilters({ categories, clubs, countries = [], current }) {
  const router = useRouter();
  const [q, setQ] = useState(current.q || '');
  const firstRender = useRef(true);

  function go(next) {
    const merged = { ...current, ...next };
    const params = new URLSearchParams();
    Object.entries(merged).forEach(([key, value]) => {
      if (value && !(key === 'sort' && value === 'newest')) params.set(key, value);
    });
    const qs = params.toString();
    router.push(qs ? `/shop?${qs}` : '/shop');
  }

  // Search as you type (waits a moment after typing stops).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = setTimeout(() => {
      if (q !== (current.q || '')) go({ q });
    }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const hasFilters = current.q || current.category || current.club || current.country || (current.sort && current.sort !== 'newest');

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row">
        <form
          className="flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            go({ q });
          }}
        >
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search jerseys or clubs…"
            className="input py-3"
            aria-label="Search jerseys"
          />
        </form>

        <select
          value={current.club || ''}
          onChange={(e) => go({ club: e.target.value })}
          className="input md:w-56"
          aria-label="Filter by club"
        >
          <option value="">All clubs</option>
          {clubs.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name} ({c.count})
            </option>
          ))}
        </select>

        <select
          value={current.country || ''}
          onChange={(e) => go({ country: e.target.value })}
          className="input md:w-48"
          aria-label="Filter by country"
        >
          <option value="">All countries</option>
          {countries.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name} ({c.count})
            </option>
          ))}
        </select>

        <select
          value={current.sort || 'newest'}
          onChange={(e) => go({ sort: e.target.value })}
          className="input md:w-56"
          aria-label="Sort products"
        >
          <option value="newest">Newest arrivals</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => go({ category: '' })}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
            !current.category ? 'border-brand bg-brand text-white' : 'border-line text-white/70 hover:border-white/50'
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => go({ category: c.slug })}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              current.category === c.slug
                ? 'border-brand bg-brand text-white'
                : 'border-line text-white/70 hover:border-white/50'
            }`}
          >
            {c.name}
          </button>
        ))}
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQ('');
              router.push('/shop');
            }}
            className="ml-1 text-sm font-medium text-white/60 underline hover:text-white"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
