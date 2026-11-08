import { Oswald, Inter } from 'next/font/google';
import './globals.css';
import CartProvider from '@/components/CartProvider';

const display = Oswald({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700'],
  display: 'swap',
});

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'Jersey Wala | Wear Your Passion.',
    template: '%s | Jersey Wala',
  },
  description:
    'Jersey Wala, Pakistan’s football jersey store. Every club has a story. Every jersey has an identity. Order easily via Instagram.',
};

export const viewport = {
  themeColor: '#0a0a0a',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
