'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) {
      setError('Wrong email or password. Please try again.');
      setLoading(false);
      return;
    }
    router.push('/admin');
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-heading block text-center text-3xl font-bold">
          Jersey <span className="text-brand">Wala</span>
        </Link>
        <p className="mt-2 text-center text-sm text-white/50">Store admin login</p>

        <form onSubmit={handleSubmit} className="card mt-8 space-y-4 p-6">
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="password" className="label">Password</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </div>
          {error && (
            <p role="alert" className="rounded-lg border border-brand/50 bg-brand/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
          <button type="submit" disabled={loading} className="btn-red w-full">
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-white/40">
          <Link href="/" className="hover:text-white">← Back to website</Link>
        </p>
      </div>
    </main>
  );
}
