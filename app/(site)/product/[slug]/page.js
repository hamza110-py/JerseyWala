import Link from 'next/link';
import { notFound } from 'next/navigation';
import Gallery from '@/components/Gallery';
import AddToCart from '@/components/AddToCart';
import ProductCard from '@/components/ProductCard';
import { getProductBySlug, listProducts } from '@/lib/products';
import { getSettings } from '@/lib/settings';
import {
  SIZES,
  discountPercent,
  effectivePrice,
  formatPKR,
  hasDiscount,
  instagramLinks,
  isAvailable,
  parseSpecs,
} from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: 'Product not found' };
  return {
    title: product.name,
    description: (product.description || '').slice(0, 155),
    openGraph: { images: product.images?.[0] ? [product.images[0]] : [] },
  };
}

export default async function ProductPage({ params }) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const settings = await getSettings();
  const related = (await listProducts({ club: product.club || undefined, limit: 5 }))
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  const available = isAvailable(product);
  const sale = hasDiscount(product);
  const price = effectivePrice(product);
  const stock = Number(product.stock) || 0;
  const sizes = SIZES.filter((s) => (product.sizes || []).includes(s));
  const specs = parseSpecs(product.specifications);

  let stockLabel = 'In stock';
  let stockClass = 'text-green-400';
  if (!available) {
    stockLabel = 'Sold out';
    stockClass = 'text-red-400';
  } else if (stock <= 5) {
    stockLabel = `Only ${stock} left`;
    stockClass = 'text-amber-400';
  }

  return (
    <div className="container-x py-8 sm:py-12">
      <nav className="mb-6 text-sm text-white/50" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-white">Home</Link> /{' '}
        <Link href="/shop" className="hover:text-white">Shop</Link> /{' '}
        <span className="text-white/80">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        <Gallery images={product.images} name={product.name} />

        <div className="lg:sticky lg:top-24 lg:self-start">
          {product.club && (
            <Link
              href={`/shop?club=${encodeURIComponent(product.club)}`}
              className="text-xs font-semibold uppercase tracking-[0.25em] text-brand hover:underline"
            >
              {product.club}
            </Link>
          )}
          <h1 className="font-heading mt-2 text-3xl font-bold leading-tight sm:text-4xl">{product.name}</h1>

          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className={`text-3xl font-bold ${sale ? 'text-brand' : 'text-white'}`}>{formatPKR(price)}</span>
            {sale && (
              <>
                <span className="text-lg text-white/40 line-through">{formatPKR(product.price)}</span>
                <span className="rounded bg-brand px-2 py-1 text-xs font-bold">SAVE {discountPercent(product)}%</span>
              </>
            )}
          </div>

          <p className={`mt-3 text-sm font-semibold ${stockClass}`}>● {stockLabel}</p>

          <div className="my-6 h-px bg-line" />

          <AddToCart
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              image: product.images?.[0] || '',
              price,
              sizes,
              stock,
              available,
            }}
            instagramProfile={instagramLinks(settings.instagram_username).profile}
          />

          {product.description && (
            <div className="mt-10">
              <h2 className="font-heading text-xl font-semibold">Description</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-white/70">{product.description}</p>
            </div>
          )}

          <div className="mt-8">
            <h2 className="font-heading text-xl font-semibold">Specifications</h2>
            <dl className="mt-3 divide-y divide-line rounded-xl border border-line bg-panel text-sm">
              {product.categories?.name && (
                <div className="flex justify-between gap-4 px-4 py-3">
                  <dt className="text-white/50">Category</dt>
                  <dd className="text-right font-medium">{product.categories.name}</dd>
                </div>
              )}
              {product.club && (
                <div className="flex justify-between gap-4 px-4 py-3">
                  <dt className="text-white/50">Club / Team</dt>
                  <dd className="text-right font-medium">{product.club}</dd>
                </div>
              )}
              {sizes.length > 0 && (
                <div className="flex justify-between gap-4 px-4 py-3">
                  <dt className="text-white/50">Sizes</dt>
                  <dd className="text-right font-medium">{sizes.join(', ')}</dd>
                </div>
              )}
              {product.country && (
                <div className="flex justify-between gap-4 px-4 py-3">
                  <dt className="text-white/50">Country</dt>
                  <dd className="text-right font-medium">{product.country}</dd>
                </div>
              )}
              {specs.map((s, i) => (
                <div key={i} className="flex justify-between gap-4 px-4 py-3">
                  <dt className="text-white/50">{s.label || 'Detail'}</dt>
                  <dd className="text-right font-medium">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-heading mb-6 text-2xl font-bold sm:text-3xl">You May Also Like</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
