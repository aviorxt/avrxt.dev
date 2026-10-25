const productionOrigins = new Set(['https://www.avrxt.dev', 'https://avrxt.dev', 'https://me.avrxt.dev']);

function previewOrigins() {
  if (process.env.VERCEL_ENV !== 'preview') return [];
  return [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]
    .filter((host): host is string => Boolean(host && /^[a-z0-9-]+\.vercel\.app$/i.test(host)))
    .map((host) => `https://${host}`);
}

export function isTrustedMutationOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const fetchSite = request.headers.get('sec-fetch-site');

  // Browser mutations must be same-origin. Reject missing Origin as well: these
  // endpoints are designed for the website, not as cross-site form targets.
  if (!origin || origin === 'null' || fetchSite === 'cross-site') return false;
  if (productionOrigins.has(origin) || previewOrigins().includes(origin)) return true;

  const requestUrl = new URL(request.url);
  return process.env.NODE_ENV !== 'production'
    && ['localhost', '127.0.0.1'].includes(requestUrl.hostname)
    && origin === requestUrl.origin;
}

export function isJsonRequest(request: Request) {
  return /^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '');
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function publicError(message = 'Request could not be completed.') {
  return { error: message };
}
