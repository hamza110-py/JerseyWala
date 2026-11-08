import { Instagram } from 'lucide-react';

// Round Instagram button, shown on phones only.
export default function FloatingInstagram({ href }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Message us on Instagram"
      className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-black/50 transition hover:bg-brand-dark active:scale-95 md:hidden"
    >
      <Instagram size={26} aria-hidden="true" />
    </a>
  );
}
