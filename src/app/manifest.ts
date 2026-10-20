import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AVRXT.DEV',
    short_name: 'AVRXT',
    description: 'The official portfolio and tools site for avrxt (aviorxt).',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#050505',
    theme_color: '#000000',
    icons: [
      { src: '/brand/avrxt-selected/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/brand/avrxt-selected/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
