import { makeUnsubscribeUrl, validUnsubscribeToken } from '../src/lib/unsubscribe-core';
// Compatibility only: deploy after the Next.js preferences page is live.
// Existing emails retain their tokens; no database or Resend access runs here.
const legacyUnsubscribeRedirect = {
  async fetch(request: Request): Promise<Response> {
    const token = new URL(request.url).pathname.match(/^\/mail\/([^/]+)\/?$/)?.[1];
    const headers = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, nofollow' };
    if (!validUnsubscribeToken(token)) return new Response('This email preferences link is unavailable.', { status: 404, headers });
    if (!['GET','HEAD','POST'].includes(request.method)) return new Response('Method not allowed', { status: 405, headers: { ...headers, Allow: 'GET, HEAD, POST' } });
    // An old form POST becomes a fresh GET requiring explicit confirmation on
    // the main website; never forward a cross-origin mutating request.
    return new Response(null, { status: request.method === 'POST' ? 303 : 302, headers: { ...headers, Location: makeUnsubscribeUrl(token) } });
  },
};
export default legacyUnsubscribeRedirect;
