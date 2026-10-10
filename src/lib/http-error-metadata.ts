import type { Metadata } from 'next';

const labels: Record<string, string> = {
  '400': 'Bad Request',
  '401': 'Unauthorized',
  '403': 'Forbidden',
  '404': 'Page Not Found',
  '408': 'Request Timeout',
  '429': 'Too Many Requests',
  '500': 'Server Error',
  '502': 'Bad Gateway',
  '503': 'Service Unavailable',
  '504': 'Gateway Timeout',
};

export function buildHttpErrorMetadata(code: string): Metadata {
  const label = labels[code] || 'Request Error';
  return {
    title: `${code} ${label} | avrxt`,
    description: `The requested AVRXT page returned a ${code} ${label.toLowerCase()} response.`,
    alternates: { canonical: null },
    robots: { index: false, follow: false, noarchive: true },
  };
}
