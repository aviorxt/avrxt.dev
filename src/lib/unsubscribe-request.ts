import { readJsonLimited, RequestBodyError } from './read-json-limited';
import { trustedConfirmationOrigin } from './newsletter-confirmation-request';
import { validUnsubscribeToken, type PreferenceResult } from './unsubscribe-core';
export async function handleUnsubscribeRequest(request: Request, dependencies: {
  rateLimited: (headers: Headers) => Promise<boolean>;
  unsubscribe: (token: string) => Promise<PreferenceResult>;
}) {
  const respond = (value: unknown, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'same-origin', 'X-Robots-Tag': 'noindex, nofollow' } });
  if (request.method !== 'POST') return respond({ state: 'error', message: 'Use the unsubscribe button to continue.' }, 405);
  if (!trustedConfirmationOrigin(request)) return respond({ state: 'error', message: 'Open your email preferences link on avrxt.dev and try again.' }, 403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return respond({ state: 'error', message: 'Invalid preference request.' }, 415);
  try {
    const body = await readJsonLimited(request, 1024);
    const token = body && typeof body === 'object' && !Array.isArray(body) ? (body as { token?: unknown }).token : null;
    if (!validUnsubscribeToken(token)) return respond({ state: 'unavailable' }, 400);
    if (await dependencies.rateLimited(request.headers)) return respond({ state: 'error', message: 'Too many attempts. Please wait a minute, then try again.' }, 429);
    return respond(await dependencies.unsubscribe(token));
  } catch (error) {
    if (error instanceof RequestBodyError) return respond({ state: 'error', message: 'Invalid preference request.' }, error.status);
    return respond({ state: 'error', message: 'We couldn’t confirm the update. Please try again; your link is safe to retry.' }, 503);
  }
}
