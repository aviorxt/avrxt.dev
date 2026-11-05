// Explicit allowlist for Workers Cache. Everything else is non-cacheable.
const gatewayPublicTtls = new Map([
  ['/', 60], ['/v1/status', 60], ['/v1/status/details', 60],
  ['/v1/geo/search', 3600], ['/v1/geo/forecast', 900], ['/v1/link-preview', 3600],
]);
function gatewayCachePolicy(request, response) {
  // Preserve the live WebSocket response object and its webSocket property.
  if (response.status === 101 || request.headers.get('Upgrade')?.toLowerCase() === 'websocket') return response;
  const path = new URL(request.url).pathname;
  const ttl = gatewayPublicTtls.get(path);
  const headers = new Headers(response.headers);
  const vary = new Set((headers.get('Vary') || '').split(',').map(value => value.trim()).filter(Boolean));
  // Prevent public cache hits being reused for cookie-bearing requests before
  // the Worker gets a chance to classify those requests.
  for (const field of ['Origin', 'Cookie', 'Authorization']) vary.add(field);
  headers.set('Vary', [...vary].join(', '));
  const policy = headers.get('Cache-Control') || '';
  const safe = (request.method === 'GET' || request.method === 'HEAD') && response.status === 200 && ttl
    && !request.headers.has('Authorization') && !request.headers.has('Cookie')
    && !headers.has('Set-Cookie') && !/no-store|no-cache|private/i.test(policy);
  if (safe) {
    // Never extend an upstream's shorter freshness lifetime.
    const original = policy.match(/(?:s-maxage|max-age)\s*=\s*(\d+)/i);
    const seconds = original ? Math.min(ttl, Number(original[1])) : ttl;
    headers.set('Cache-Control', `public, max-age=0, s-maxage=${seconds}, must-revalidate`);
  } else headers.set('Cache-Control', 'private, no-store, max-age=0');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
export { gatewayCachePolicy };
