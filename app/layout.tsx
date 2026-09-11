import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Between Us',
  description: 'An emotional interactive story.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
