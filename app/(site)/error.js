'use client';

export default function ErrorPage({ reset }) {
  return (
    <div className="container-x py-24 text-center">
      <p className="font-heading text-3xl font-bold">Something went wrong.</p>
      <p className="mt-2 text-white/60">Please try again in a moment.</p>
      <button type="button" onClick={() => reset()} className="btn-red mt-6">
        Try again
      </button>
    </div>
  );
}
