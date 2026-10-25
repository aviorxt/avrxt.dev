import { readJsonLimited, RequestBodyError } from './read-json-limited';

export type ConfirmationResult = { state: 'confirmed' | 'expired' | 'unavailable'; message: string };
export const validConfirmationToken = (token: unknown): token is string => typeof token === 'string' && /^[A-Za-z0-9_-]{43}$/.test(token);

export function trustedConfirmationOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (request.headers.get('sec-fetch-site') === 'cross-site' || !origin || origin === 'null') return false;
  // Public aliases are explicit: an internal deployment URL or forwarded host
  // must never become authorization for an arbitrary origin.
  if (origin === 'https://www.avrxt.dev' || origin === 'https://avrxt.dev') return true;
  if (process.env.VERCEL_ENV === 'preview') {
    const previews = [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]
      .filter((host): host is string => Boolean(host && /^[a-z0-9-]+\.vercel\.app$/.test(host)))
      .map(host => `https://${host}`);
    if (origin === 'https://staging.avrxt.dev' || previews.includes(origin)) return true;
  }
  const url = new URL(request.url);
  return process.env.NODE_ENV !== 'production' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1') && origin === url.origin;
}

export async function handleConfirmationRequest(request: Request, dependencies: {
  rateLimited: (headers: Headers) => Promise<boolean>;
  confirm: (token: string) => Promise<ConfirmationResult>;
}) {
  const respond = (state: string, message: string, status = 200) => Response.json({ state, message }, {
    status, headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'same-origin', 'X-Robots-Tag': 'noindex, nofollow' },
  });
  if (request.method !== 'POST') return respond('error', 'Use the confirmation button to continue.', 405);
  if (!trustedConfirmationOrigin(request)) return respond('error', 'Open the confirmation link on avrxt.dev and try again.', 403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return respond('error', 'The confirmation request is invalid.', 415);
  try {
    const body = await readJsonLimited(request, 1024);
    const token = body && typeof body === 'object' && !Array.isArray(body) ? (body as { token?: unknown }).token : null;
    if (!validConfirmationToken(token)) return respond('unavailable', 'This confirmation link is unavailable. Please request a new one.', 400);
    if (await dependencies.rateLimited(request.headers)) return respond('error', 'Too many attempts. Please wait a minute, then try again.', 429);
    const result = await dependencies.confirm(token);
    return respond(result.state, result.message);
  } catch (error) {
    if (error instanceof RequestBodyError) return respond('error', 'The confirmation request is invalid.', error.status);
    return respond('error', 'We couldn’t confirm your subscription right now. Your link is safe to retry.', 503);
  }
}
