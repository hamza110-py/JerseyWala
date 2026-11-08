export const metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }) {
  return <div className="min-h-screen bg-ink">{children}</div>;
}
