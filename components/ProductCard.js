import Link from 'next/link';
import {
  PLACEHOLDER_IMAGE,
  formatPKR,
  effectivePrice,
  hasDiscount,
  discountPercent,
  isAvailable,
} from '@/lib/utils';

export default function ProductCard({ product }) {
  const first = product.images?.[0] || PLACEHOLDER_IMAGE;
  const second = product.images?.[1];
  const available = isAvailable(product);
  const sale = hasDiscount(product);

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-line bg-panel">
        <img
          src={first}
          alt={product.name}
          loading="lazy"
          className={`absolute inset-0 h-full w-full object-cover transition duration-500 ${
            second ? 'group-hover:opacity-0' : 'group-hover:scale-105'
          } ${available ? '' : 'opacity-50'}`}
        />
        {second && (
          <img
            src={second}
            alt=""
            loading="lazy"
            className={`absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 group-hover:opacity-100 ${
              available ? '' : 'grayscale'
            }`}
          />
        )}

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {!available && (
            <span className="rounded bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-black">
              Sold out
            </span>
          )}
          {available && product.is_new_arrival && (
            <span className="rounded bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-black">
              New
            </span>
          )}
          {available && sale && (
            <span className="rounded bg-brand px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              -{discountPercent(product)}%
            </span>
          )}
        </div>
      </div>

      <div className="mt-3">
        {product.club && (
          <p className="text-xs font-medium uppercase tracking-widest text-white/50">{product.club}</p>
        )}
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug transition group-hover:text-brand sm:text-base">
          {product.name}
        </h3>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className={`font-semibold ${sale ? 'text-brand' : 'text-white'}`}>
            {formatPKR(effectivePrice(product))}
          </span>
          {sale && (
            <span className="text-sm text-white/40 line-through">{formatPKR(product.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
