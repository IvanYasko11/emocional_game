import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BETWEEN US — интерактивная история',
  description: 'История о доверии, выборе и том, что остаётся между людьми. 15–20 минут. Несколько разных последствий.',
  applicationName: 'BETWEEN US',
  keywords: ['BETWEEN US', 'интерактивная история', 'эмоциональная игра', 'interactive story'],
  openGraph: {
    title: 'BETWEEN US — иногда нужно, чтобы кто-то остался',
    description: '15–20 минут. Несколько выборов. И история, которая помнит тебя.',
    type: 'website',
    locale: 'ru_RU',
    siteName: 'BETWEEN US',
  },
  twitter: {
    card: 'summary',
    title: 'BETWEEN US — интерактивная история',
    description: 'История о доверии, выборе и том, что остаётся между людьми.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
