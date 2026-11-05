import gateway, { json, withCors, rateLimited, getPublicConfig } from './gateway.mjs';
import { handleMuzix } from './lastfm.mjs';
import { gatewayCachePolicy } from './cache-policy.mjs';
import { handleNewsletter } from './newsletter.mjs';

const musicRoutes = new Set(['/v1/music/chart', '/v1/music/now-playing', '/v1/music/artwork', '/v1/music/artist-image']);

export default {
  async fetch(request: Request, env: Record<string, unknown>): Promise<Response> {
    let response: Response;
    const path = new URL(request.url).pathname;
    if (request.method !== 'OPTIONS' && ['/v1/music/subscribe', '/v1/music/confirm', '/v1/music/unsubscribe'].includes(path)) {
      response = withCors(request, await handleNewsletter(request, env));
    } else if (request.method !== 'OPTIONS' && musicRoutes.has(path)) {
      if (rateLimited(request)) {
        response = json(request, { error: 'Too many requests' }, 429, { 'Retry-After': '60', 'Cache-Control': 'no-store' });
      } else {
        const profile = await getPublicConfig(env);
        if (profile?.site?.profileEnabled === false) {
          response = json(request, { error: 'PROFILE_DISABLED' }, 404, { 'Cache-Control': 'no-store' });
        } else {
          try { response = withCors(request, await handleMuzix(request, env)); }
          catch { response = json(request, { error: 'Listening feed temporarily unavailable.' }, 502, { 'Cache-Control': 'no-store' }); }
        }
      }
    } else {
      response = await gateway.fetch(request, env);
    }
    return gatewayCachePolicy(request, response);
  },
};
