import CartView from '@/components/CartView';
import { getSettings } from '@/lib/settings';
import { instagramLinks } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your Cart' };

export default async function CartPage() {
  const settings = await getSettings();
  const ig = instagramLinks(settings.instagram_username);

  return (
    <div className="container-x py-10 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">Almost yours</p>
      <h1 className="font-heading mb-8 mt-1 text-4xl font-bold sm:text-5xl">Your Cart</h1>
      <CartView instagramProfile={ig.profile} instagramUsername={ig.username} />
    </div>
  );
}
