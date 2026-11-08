'use client';

import { useState } from 'react';
import { PLACEHOLDER_IMAGE } from '@/lib/utils';

export default function Gallery({ images, name }) {
  const list = images && images.length > 0 ? images : [PLACEHOLDER_IMAGE];
  const [index, setIndex] = useState(0);
  const current = list[Math.min(index, list.length - 1)];

  const prev = () => setIndex((i) => (i - 1 + list.length) % list.length);
  const next = () => setIndex((i) => (i + 1) % list.length);

  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-line bg-panel">
        <img
          key={current}
          src={current}
          alt={name}
          className="absolute inset-0 h-full w-full animate-fadeUp object-cover"
        />
        {list.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-lg backdrop-blur transition hover:bg-brand"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-lg backdrop-blur transition hover:bg-brand"
            >
              ›
            </button>
          </>
        )}
      </div>

      {list.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2 sm:gap-3">
          {list.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show image ${i + 1}`}
              className={`relative aspect-square overflow-hidden rounded-lg border-2 transition ${
                i === index ? 'border-brand' : 'border-line opacity-70 hover:opacity-100'
              }`}
            >
              <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
