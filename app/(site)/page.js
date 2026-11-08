import Link from 'next/link';
import { Instagram, MessageCircle, Truck, Shirt, Zap } from 'lucide-react';
import ProductSection from '@/components/ProductSection';
import { getClubs, getCountries, listProducts } from '@/lib/products';
import { getSettings } from '@/lib/settings';
import { instagramLinks, PLACEHOLDER_IMAGE } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const WHY = [
  {
    icon: Shirt,
    title: 'Your Clubs, Your Colours',
    text: 'Club and national team jerseys, from current kits to retro classics.',
  },
  {
    icon: Zap,
    title: 'Order in Minutes',
    text: 'No complicated checkout. Fill your cart, then send us the details on Instagram.',
  },
  {
    icon: Truck,
    title: 'Delivery Across Pakistan',
    text: 'We confirm availability and delivery details with you personally before anything ships.',
  },
  {
    icon: MessageCircle,
    title: 'Real People, Real Support',
    text: 'Questions about sizing or stock? Chat with us directly. No bots, no waiting.',
  },
];

function ChipGrid({ eyebrow, title, items, param }) {
  if (!items || items.length === 0) return null;
  return (
    <section className="container-x mt-20">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">{eyebrow}</p>
        <h2 className="font-heading mt-1 text-3xl font-bold sm:text-4xl">{title}</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.name}
            href={`/shop?${param}=${encodeURIComponent(item.name)}`}
            className="group relative overflow-hidden rounded-xl border border-line bg-panel p-5 transition hover:border-brand"
          >
            <span className="absolute -bottom-6 -right-2 font-display text-8xl font-bold text-white/[0.04] transition group-hover:text-brand/20">
              {item.name.charAt(0)}
            </span>
            <p className="font-heading relative text-xl font-semibold leading-tight">{item.name}</p>
            <p className="relative mt-1 text-xs text-white/50">
              {item.count} {item.count === 1 ? 'jersey' : 'jerseys'}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const [settings, newArrivals, popular, featured, retro, clubs, countries, latest] = await Promise.all([
    getSettings(),
    listProducts({ flag: 'is_new_arrival', limit: 8 }),
    listProducts({ flag: 'is_best_seller', limit: 8 }),
    listProducts({ flag: 'is_featured', limit: 8 }),
    listProducts({ flag: 'is_retro', limit: 8 }),
    getClubs(),
    getCountries(),
    listProducts({ limit: 6 }),
  ]);
  const ig = instagramLinks(settings.instagram_username);

  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden border-b border-line">
        {settings.hero_image_url ? (
          <img src={settings.hero_image_url} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        ) : (
          <div
            className="absolute inset-0 -z-20"
            style={{
              backgroundImage:
                'radial-gradient(ellipse at 70% 30%, rgba(225,6,0,0.35), transparent 55%), linear-gradient(180deg, #141414, #0a0a0a)',
            }}
          />
        )}
        {!settings.hero_image_url && (
          <svg
            aria-hidden="true"
            viewBox="0 0 200 200"
            className="absolute -right-10 top-1/2 -z-10 h-[34rem] w-[34rem] -translate-y-1/2 text-brand/20 sm:right-10 lg:h-[44rem] lg:w-[44rem]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          >
            <path d="M70 20 L40 35 L10 70 L35 90 L50 78 L50 180 L150 180 L150 78 L165 90 L190 70 L160 35 L130 20 C125 35 75 35 70 20 Z" />
          </svg>
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/70 to-transparent" />

        <div className="container-x py-24 sm:py-32 lg:py-44">
          <p className="animate-fadeUp text-xs font-semibold uppercase tracking-[0.35em] text-brand">Jersey Wala</p>
          <h1
            className="font-heading mt-4 max-w-3xl animate-fadeUp text-5xl font-bold leading-[0.95] sm:text-7xl lg:text-8xl"
            style={{ animationDelay: '0.1s' }}
          >
            Wear Your <span className="text-brand">Passion.</span>
          </h1>
          <p className="mt-6 max-w-xl animate-fadeUp text-lg text-white/75 sm:text-xl" style={{ animationDelay: '0.2s' }}>
            Every club has a story. Every jersey has an identity. Find yours at Jersey Wala.
          </p>
          <div className="mt-9 flex animate-fadeUp flex-wrap gap-3" style={{ animationDelay: '0.3s' }}>
            <Link href="/shop" className="btn-red px-8 py-4 text-base uppercase tracking-wider">
              Explore Collection
            </Link>
            <a
              href={ig.profile}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline px-8 py-4 text-base uppercase tracking-wider"
            >
              <Instagram size={18} aria-hidden="true" />
              Message us on Instagram
            </a>
          </div>
        </div>
      </section>

      {latest.length === 0 && (
        <section className="container-x mt-16">
          <div className="card p-8 text-center">
            <p className="font-heading text-2xl font-bold">New drops are coming soon.</p>
            <p className="mt-2 text-white/60">Follow us on Instagram so you never miss a jersey.</p>
          </div>
        </section>
      )}

      <ProductSection eyebrow="Just dropped" title="New Arrivals" products={newArrivals} href="/shop?sort=newest" />
      <ProductSection eyebrow="Fan favourites" title="Popular Jerseys" products={popular} />
      <ProductSection eyebrow="Hand-picked" title="Featured Jerseys" products={featured} />
      <ChipGrid eyebrow="Find your team" title="Shop by Club" items={clubs} param="club" />
      <ChipGrid eyebrow="Represent your nation" title="Shop by Country" items={countries} param="country" />
      <ProductSection eyebrow="Timeless" title="Retro Football Jerseys" products={retro} href="/shop?category=retro-classics" />

      {/* WHY CHOOSE */}
      <section className="container-x mt-24">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">The difference</p>
          <h2 className="font-heading mt-1 text-3xl font-bold sm:text-4xl">Why Choose Jersey Wala?</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.map((item) => (
            <div key={item.title} className="card p-6">
              <item.icon size={28} className="text-brand" aria-hidden="true" />
              <h3 className="font-heading mt-4 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* INSTAGRAM */}
      <section className="container-x mt-24">
        <div className="overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-panel to-charcoal p-6 sm:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
            <div className="lg:w-1/2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">Order on Instagram</p>
              <h2 className="font-heading mt-2 text-3xl font-bold sm:text-4xl">Follow @{ig.username}</h2>
              <p className="mt-3 max-w-md text-white/65">
                Fresh drops, restocks and giveaways land on Instagram first. Ordering is as easy as sending us a message.
              </p>
              <a href={ig.profile} target="_blank" rel="noopener noreferrer" className="btn-red mt-6">
                <Instagram size={18} aria-hidden="true" />
                Message us on Instagram
              </a>
            </div>
            <div className="grid grid-cols-3 gap-2 lg:w-1/2">
              {(latest.length ? latest : [null, null, null]).slice(0, 6).map((p, i) => (
                <a
                  key={p?.id || i}
                  href={ig.profile}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open our Instagram"
                  className="group relative aspect-square overflow-hidden rounded-lg border border-line bg-panel"
                >
                  <img
                    src={p?.images?.[0] || PLACEHOLDER_IMAGE}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
