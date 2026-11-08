import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Privacy Policy' };

export default async function PrivacyPage() {
  const settings = await getSettings();
  const contact = settings.email || `@${settings.instagram_username} on Instagram`;

  return (
    <div className="container-x max-w-3xl py-12 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">Legal</p>
      <h1 className="font-heading mt-2 text-4xl font-bold sm:text-5xl">Privacy Policy</h1>
      <p className="mt-3 text-sm text-white/50">Last updated: {new Date().getFullYear()}</p>

      <div className="mt-8 space-y-6 leading-relaxed text-white/75">
        <section>
          <h2 className="font-heading text-xl font-semibold text-white">What we collect</h2>
          <p className="mt-2">
            You do not need an account to shop at Jersey Wala. We do not collect your name, phone number, address or
            payment details on this website. When you tap “Order via Instagram”, we save only what is in your cart (the
            jerseys, sizes, quantities and total) together with a reference code, so we can match it with your Instagram
            message.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-white">Your cart</h2>
          <p className="mt-2">
            Your cart is stored in your own browser on your device. Clearing your browser data removes it.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-white">Ordering through Instagram</h2>
          <p className="mt-2">
            Orders are completed in a direct message on Instagram. Anything you send there (such as your delivery
            address) is handled under Instagram’s own terms and privacy policy. We use it only to confirm and deliver
            your order.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-white">Payments</h2>
          <p className="mt-2">This website does not process payments. Payment details are agreed directly with you on Instagram.</p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-white">Third-party services</h2>
          <p className="mt-2">
            The website is hosted on Vercel and uses Supabase to store products and order enquiries. Fonts are loaded
            through Google Fonts.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-white">Contact</h2>
          <p className="mt-2">Questions about your data? Contact us at {contact}.</p>
        </section>
      </div>
    </div>
  );
}
