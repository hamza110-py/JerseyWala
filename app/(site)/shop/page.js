import ProductCard from '@/components/ProductCard';
import ShopFilters from '@/components/ShopFilters';
import { getCategories, getClubs, getCountries, listProducts } from '@/lib/products';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Shop Football Jerseys' };

const pick = (v) => (Array.isArray(v) ? v[0] : v) || '';

export default async function ShopPage({ searchParams }) {
  const q = pick(searchParams?.q);
  const categorySlug = pick(searchParams?.category);
  const club = pick(searchParams?.club);
  const country = pick(searchParams?.country);
  const sort = pick(searchParams?.sort) || 'newest';

  const [categories, clubs, countries] = await Promise.all([getCategories(), getClubs(), getCountries()]);
  const category = categories.find((c) => c.slug === categorySlug);

  const products = await listProducts({
    q,
    categoryId: category?.id,
    club,
    country,
    sort,
  });

  return (
    <div className="container-x py-10 sm:py-14">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">The collection</p>
        <h1 className="font-heading mt-1 text-4xl font-bold sm:text-5xl">All Jerseys</h1>
      </div>

      <ShopFilters
        categories={categories}
        clubs={clubs}
        countries={countries}
        current={{ q, category: category ? categorySlug : '', club, country, sort }}
      />

      <p className="mt-8 text-sm text-white/50">
        {products.length} {products.length === 1 ? 'jersey' : 'jerseys'} found
      </p>

      {products.length === 0 ? (
        <div className="card mt-6 p-10 text-center">
          <p className="font-heading text-2xl font-bold">No jerseys match your search.</p>
          <p className="mt-2 text-white/60">Try a different club or clear the filters.</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
