import Link from 'next/link';
import ProductCard from '@/components/ProductCard';

export default function ProductSection({ eyebrow, title, products, href = '/shop', linkLabel = 'View all' }) {
  if (!products || products.length === 0) return null;
  return (
    <section className="container-x mt-20">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">{eyebrow}</p>
          )}
          <h2 className="font-heading mt-1 text-3xl font-bold sm:text-4xl">{title}</h2>
        </div>
        <Link href={href} className="shrink-0 text-sm font-semibold text-white/70 transition hover:text-brand">
          {linkLabel} →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
