import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="font-heading text-7xl font-bold text-brand">404</p>
      <h1 className="font-heading mt-2 text-3xl font-semibold">Offside! Page not found.</h1>
      <p className="mt-3 max-w-md text-white/60">
        The page you are looking for does not exist or the product is no longer available.
      </p>
      <Link href="/shop" className="btn-red mt-8">
        Back to the shop
      </Link>
    </main>
  );
}
