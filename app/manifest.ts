import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BETWEEN US — интерактивная история',
    short_name: 'BETWEEN US',
    description: 'История о доверии, выборе и том, что остаётся между людьми.',
    start_url: '/',
    display: 'standalone',
    background_color: '#070707',
    theme_color: '#070707',
    lang: 'ru',
    orientation: 'portrait',
  };
}
