interface Env {
  SITE_ORIGIN?: string;
  SPOTIFY_NOW_PLAYING_UPSTREAM?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  YOUTUBE_API_KEY?: string;
  MAIL_AI_SHARED_SECRET?: string;
  GATEWAY_SHARED_SECRET?: string;
  AI: { run(model: string, input: { messages: Array<{ role: 'system' | 'user'; content: string }>; response_format?: { type: 'json_object' }; max_completion_tokens?: number }): Promise<unknown> };
  MAIL_AI_LIMITER: { limit(options: { key: string }): Promise<{ success: boolean }> };
}

const STATUS_SOURCES = ['https://avrxt-dev.betteruptime.com/index.json', 'https://status.avrxt.dev/index.json'];
const PUBLIC_CONFIG_CACHE_KEY = new Request('https://avrxt.internal/cache/public-profile-config');
const requestBuckets = new Map<string, { count: number; resetAt: number }>();

const ALLOWED_ORIGINS = new Set([
  'https://avrxt.dev',
  'https://www.avrxt.dev',
  'https://me.avrxt.dev',
  'http://localhost:3000',
]);

const PUBLIC_PROXY_ROUTES: Record<string, string> = {
  '/v1/contact': '/api/contact',
  '/v1/subscribe': '/api/subscribe',
  '/v1/status/details': '/api/status/details',
  '/v1/health': '/api/health',
  '/v1/link-preview': '/api/link-preview',
  '/v1/og': '/api/og',
  '/v1/spotify/chart': '/api/spotify/chart',
};

const CACHEABLE_PROXY_ROUTES: Record<string, number> = {
  '/v1/status/details': 60,
  '/v1/spotify/chart': 60,
};

function corsHeaders(request: Request) {
  const origin = request.headers.get('Origin');
  const allowedOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://www.avrxt.dev';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(request: Request, value: unknown, status = 200, extra: HeadersInit = {}) {
  return Response.json(value, {
    status,
    headers: { ...corsHeaders(request), ...extra },
  });
}

function withCors(request: Request, response: Response) {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders(request)).forEach(([key, value]) => headers.set(key, value));
  headers.set('X-AVRXT-Gateway', 'api-v1');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function proxyToSite(request: Request, env: Env, targetPath: string, cacheTtl?: number) {
  const source = new URL(request.url);
  const target = new URL(targetPath, env.SITE_ORIGIN || 'https://www.avrxt.dev');
  target.search = source.search;
  const headers = new Headers(request.headers);
  headers.delete('host');
  if (cacheTtl) headers.delete('cookie');
  headers.set('X-Forwarded-Host', source.host);
  headers.set('X-AVRXT-Gateway', 'api-v1');
  for (const name of ['x-avrxt-client-ip', 'x-avrxt-client-time', 'x-avrxt-client-signature']) headers.delete(name);
  const gatewaySecret = env.GATEWAY_SHARED_SECRET || env.MAIL_AI_SHARED_SECRET;
  const clientIp = request.headers.get('cf-connecting-ip');
  if (gatewaySecret && clientIp) {
    const timestamp = Date.now().toString();
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(gatewaySecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}\n${clientIp}`));
    headers.set('x-avrxt-client-ip', clientIp);
    headers.set('x-avrxt-client-time', timestamp);
    headers.set('x-avrxt-client-signature', Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join(''));
  }
  const response = await fetch(target, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    redirect: 'manual',
    ...(cacheTtl ? { cf: { cacheEverything: true, cacheTtl } } : {}),
  } as RequestInit);
  return response;
}

function rateLimited(request: Request, maximum = 120, windowMs = 60_000) {
  const ip = request.headers.get('cf-connecting-ip') || 'anonymous';
  const now = Date.now();
  const record = requestBuckets.get(ip);
  if (!record || now >= record.resetAt) {
    requestBuckets.set(ip, { count: 1, resetAt: now + windowMs });
    if (requestBuckets.size > 10_000) requestBuckets.clear();
    return false;
  }
  if (record.count >= maximum) return true;
  record.count += 1;
  return false;
}

function state(value: unknown): 'operational' | 'degraded' | 'down' | 'maintenance' | 'unknown' {
  switch (typeof value === 'string' ? value.toLowerCase().replace(/[\s-]/g, '_') : '') {
    case 'operational': case 'resolved': return 'operational';
    case 'degraded': case 'degraded_performance': return 'degraded';
    case 'down': case 'downtime': case 'partial_outage': case 'major_outage': return 'down';
    case 'maintenance': case 'under_maintenance': return 'maintenance';
    default: return 'unknown';
  }
}

const STATUS_LABELS: Record<ReturnType<typeof state>, string> = {
  operational: 'All systems operational',
  degraded: 'Some services are degraded',
  down: 'Service disruption',
  maintenance: 'Maintenance in progress',
  unknown: 'Status temporarily unavailable',
};

async function externalJson(request: Request, upstream: URL, cacheTtl: number) {
  try {
    const response = await fetch(upstream.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cf: { cacheEverything: true, cacheTtl },
    } as RequestInit);
    if (!response.ok) return json(request, { error: 'Upstream service unavailable' }, response.status, { 'Cache-Control': 'no-store' });
    const headers = new Headers(response.headers);
    headers.set('Content-Type', 'application/json; charset=utf-8');
    headers.set('Cache-Control', `public, max-age=${cacheTtl}`);
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  } catch {
    return json(request, { error: 'Upstream service unavailable' }, 502, { 'Cache-Control': 'no-store' });
  }
}

type PublicConfig = { site?: { profileEnabled?: boolean; statusPageEnabled?: boolean; statusBadgeEnabled?: boolean } };

async function getPublicConfig(env: Env): Promise<PublicConfig | null> {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return null;
  const cache = await caches.open('avrxt-public-config');
  const cached = await cache.match(PUBLIC_CONFIG_CACHE_KEY);
  if (cached) {
    try { return await cached.json() as PublicConfig; } catch { /* refresh an invalid cache entry */ }
  }
  try {
    const upstream = new URL('/rest/v1/me_config', env.SUPABASE_URL);
    upstream.search = 'select=data&key=eq.main_config';
    const response = await fetch(upstream.toString(), {
      headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`, Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const rows = await response.json() as Array<{ data?: PublicConfig }>;
    const config = rows[0]?.data;
    if (!config || typeof config !== 'object') return null;
    await cache.put(PUBLIC_CONFIG_CACHE_KEY, new Response(JSON.stringify(config), { headers: { 'Cache-Control': 'public, max-age=60' } }));
    return config;
  } catch {
    return null;
  }
}

async function handleGeo(request: Request, mode: 'search' | 'forecast') {
  const input = new URL(request.url);
  const upstream = new URL(mode === 'search' ? 'https://geocoding-api.open-meteo.com/v1/search' : 'https://api.open-meteo.com/v1/forecast');
  if (mode === 'search') {
    const query = input.searchParams.get('name')?.trim() || '';
    if (!query || query.length > 120) return json(request, { error: 'Invalid location query' }, 400);
    upstream.searchParams.set('name', query);
    const count = Number(input.searchParams.get('count') || '5');
    upstream.searchParams.set('count', String(Number.isFinite(count) ? Math.min(Math.max(Math.floor(count), 1), 10) : 5));
    const language = input.searchParams.get('language');
    if (language && /^[a-z]{2}$/i.test(language)) upstream.searchParams.set('language', language);
    return externalJson(request, upstream, 3600);
  }

  const latitude = Number(input.searchParams.get('latitude'));
  const longitude = Number(input.searchParams.get('longitude'));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return json(request, { error: 'Invalid coordinates' }, 400);
  }
  upstream.searchParams.set('latitude', String(latitude));
  upstream.searchParams.set('longitude', String(longitude));
  for (const key of ['current', 'hourly', 'daily', 'timezone', 'forecast_days', 'past_days']) {
    const value = input.searchParams.get(key);
    if (value && value.length <= 500 && /^[a-zA-Z0-9_,.+\-/]+$/.test(value)) upstream.searchParams.set(key, value);
  }
  return externalJson(request, upstream, 900);
}

async function handleDiscord(request: Request, discordId: string) {
  if (!/^\d{15,22}$/.test(discordId)) return json(request, { error: 'Invalid Discord user ID' }, 400);
  return externalJson(request, new URL(`https://api.lanyard.rest/v1/users/${discordId}`), 15);
}

async function handleSpotify(request: Request, env: Env) {
  const config = await getPublicConfig(env);
  if (config?.site?.profileEnabled === false) return json(request, { error: 'PROFILE_DISABLED' }, 404, { 'Cache-Control': 'no-store' });
  // The main application owns the Spotify OAuth tokens and refresh lifecycle.
  // Proxy its canonical endpoint instead of the legacy Supabase function, which
  // can return stale state after a token refresh or playback change.
  return proxyToSite(request, env, '/api/spotify/now-playing', 30);
}

async function handleStatus(request: Request, env: Env) {
  const config = await getPublicConfig(env);
  if (config?.site?.statusPageEnabled === false) return json(request, { error: 'STATUS_DISABLED', externalStatusUrl: 'https://status.avrxt.dev' }, 404, { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' });
  for (const source of STATUS_SOURCES) {
    try {
      const response = await fetch(source, { headers: { Accept: 'application/json' } });
      if (!response.ok) continue;
      const payload = await response.json() as { data?: { attributes?: { aggregate_state?: unknown } } };
      const current = state(payload.data?.attributes?.aggregate_state);
      return json(request, { status: current, label: STATUS_LABELS[current], badgeEnabled: config?.site?.statusBadgeEnabled !== false }, 200, { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' });
    } catch { /* Try the fixed fallback status source. */ }
  }
  return json(request, { status: 'unknown', label: STATUS_LABELS.unknown, badgeEnabled: config?.site?.statusBadgeEnabled !== false }, 200, { 'Cache-Control': 'no-store' });
}

async function youtubeSearch(request: Request, env: Env) {
  if (!env.YOUTUBE_API_KEY) return json(request, { error: 'YouTube API is not configured' }, 503);
  const url = new URL(request.url);
  const query = url.searchParams.get('q')?.trim();
  if (!query) return json(request, { error: 'Missing q parameter' }, 400);
  const upstream = new URL('https://www.googleapis.com/youtube/v3/search');
  upstream.search = new URLSearchParams({
    part: 'snippet', q: query, type: 'video', maxResults: '10', key: env.YOUTUBE_API_KEY,
  }).toString();
  const response = await fetch(upstream, { cf: { cacheTtl: 300, cacheEverything: true } } as RequestInit);
  if (!response.ok) return json(request, { error: 'YouTube API request failed' }, response.status);
  const data = await response.json() as { items?: Array<{ id: { videoId: string }; snippet: { title: string; channelTitle: string; thumbnails: Record<string, { url: string }> } }> };
  return json(request, (data.items || []).map(item => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
  })), 200, { 'Cache-Control': 'public, max-age=120' });
}

function escapeAiHtml(html: string) {
  return html
    .replace(/<\s*(script|iframe|object|embed|form|input|button|svg|math|style|link|meta|base)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|iframe|object|embed|form|input|button|svg|math|style|link|meta|base)\b[^>]*\/?\s*>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+(href|src|action|formaction)\s*=\s*(["'])\s*(?:javascript|data):[\s\S]*?\2/gi, '')
    .replace(/\s+(href|src|action|formaction)\s*=\s*(?:javascript|data):[^\s>]*/gi, '');
}

async function generateMailDraft(request: Request, env: Env) {
  if (request.method !== 'POST') return json(request, { error: 'Method not allowed' }, 405, { Allow: 'POST', 'Cache-Control': 'no-store' });
  const expected = env.MAIL_AI_SHARED_SECRET?.trim();
  const supplied = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '').trim() || '';
  const suppliedBytes = new TextEncoder().encode(supplied);
  const expectedBytes = new TextEncoder().encode(expected || 'missing-secret');
  let mismatch = suppliedBytes.length ^ expectedBytes.length;
  for (let index = 0; index < Math.max(suppliedBytes.length, expectedBytes.length); index++) {
    mismatch |= (suppliedBytes[index] || 0) ^ (expectedBytes[index] || 0);
  }
  if (!expected || mismatch !== 0) {
    return json(request, { error: 'Unauthorized' }, 401, { 'Cache-Control': 'no-store' });
  }
  const limited = await env.MAIL_AI_LIMITER.limit({ key: 'newsletter-draft' });
  if (!limited.success) return json(request, { error: 'Email AI is busy. Please try again shortly.' }, 429, { 'Cache-Control': 'no-store' });

  const length = Number(request.headers.get('Content-Length') || 0);
  if (length > 8_000) return json(request, { error: 'Prompt is too large' }, 413, { 'Cache-Control': 'no-store' });
  let prompt: unknown;
  try { prompt = (await request.json() as { prompt?: unknown }).prompt; }
  catch { return json(request, { error: 'Invalid JSON body' }, 400, { 'Cache-Control': 'no-store' }); }
  if (typeof prompt !== 'string' || prompt.trim().length < 8 || prompt.length > 2_000) {
    return json(request, { error: 'Prompt must be between 8 and 2,000 characters' }, 400, { 'Cache-Control': 'no-store' });
  }
  const model = '@cf/zai-org/glm-4.7-flash';
  let failureStage: 'inference' | 'response' = 'inference';
  try {
    const output = await env.AI.run(model, {
      response_format: { type: 'json_object' },
      // Keep synchronous generation within server-action limits and avoid enormous drafts.
      max_completion_tokens: 4096,
      messages: [
        { role: 'system', content: 'Create an email marketing/newsletter draft from the user request. Return a JSON object with exactly subject, previewText, and html string fields. HTML must be complete, responsive, email-client-safe HTML using tables and inline CSS; use a restrained black, white, and grayscale visual style. Keep the writing clear and polished. Do not invent company facts, claims, dates, prices, links, or offers absent from the prompt; use neutral copy/placeholders where needed. Do not include scripts, forms, iframes, external stylesheets, tracking pixels, or unsubscribe links/footers. The application adds the unsubscribe footer. Do not use markdown fences.' },
        { role: 'user', content: prompt.trim() },
      ],
    }) as { response?: unknown; choices?: Array<{ message?: { content?: unknown } }> };
    failureStage = 'response';
    const generatedText: unknown = typeof output.response === 'string' ? output.response : output.choices?.[0]?.message?.content;
    if (typeof generatedText !== 'string') throw new Error('Invalid AI response');
    const responseText = generatedText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(responseText) as { subject?: unknown; previewText?: unknown; html?: unknown };
    if (typeof parsed.subject !== 'string' || typeof parsed.previewText !== 'string' || typeof parsed.html !== 'string'
      || !parsed.subject.trim() || !parsed.html.trim() || parsed.subject.length > 200 || parsed.previewText.length > 240 || parsed.html.length > 50_000) {
      throw new Error('Invalid AI draft');
    }
    return json(request, { draft: { subject: parsed.subject.trim(), previewText: parsed.previewText.trim(), html: escapeAiHtml(parsed.html.trim()) }, model }, 200, { 'Cache-Control': 'no-store' });
  } catch (error) {
    // Do not log prompt text, authorization values, or generated email content.
    console.error('mail_ai_generation_failed', failureStage, error instanceof Error ? error.name : 'UnknownError');
    return json(request, {
      error: failureStage === 'inference'
        ? 'Cloudflare Workers AI inference failed. Check that the AI binding is enabled and the model is available.'
        : 'The AI response was not valid email JSON. Try a shorter or more specific prompt.',
    }, 502, { 'Cache-Control': 'no-store' });
  }
}

const worker = {
  async fetch(request: Request, env: Env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
    const url = new URL(request.url);

    if (rateLimited(request)) return json(request, { error: 'Too many requests' }, 429, { 'Cache-Control': 'no-store', 'Retry-After': '60' });

    if (url.pathname === '/') {
      return json(request, {
        service: 'AVRXT API Gateway', version: 'v1', status: 'online',
        documentation: 'https://www.avrxt.dev/system/api/doc',
      }, 200, { 'Cache-Control': 'public, max-age=60' });
    }

    if (url.pathname === '/v1/youtube/search') return json(request, { error: 'YouTube search is available through the authenticated admin editor.' }, 403);
    if (url.pathname === '/v1/mail/generate') return generateMailDraft(request, env);
    if (url.pathname === '/v1/geo/forecast' && request.method === 'GET') return withCors(request, await handleGeo(request, 'forecast'));
    if (url.pathname === '/v1/geo/search' && request.method === 'GET') return withCors(request, await handleGeo(request, 'search'));
    if (url.pathname.startsWith('/v1/discord/presence/') && request.method === 'GET') {
      const id = url.pathname.slice('/v1/discord/presence/'.length);
      return withCors(request, await handleDiscord(request, id));
    }
    if (url.pathname === '/v1/spotify/now-playing' && request.method === 'GET') return withCors(request, await handleSpotify(request, env));
    if (url.pathname === '/v1/status' && request.method === 'GET') return await handleStatus(request, env);

    const target = PUBLIC_PROXY_ROUTES[url.pathname];
    if (target) return withCors(request, await proxyToSite(request, env, target, request.method === 'GET' ? CACHEABLE_PROXY_ROUTES[url.pathname] : undefined));

    return json(request, { error: 'Not found', path: url.pathname }, 404);
  },
};

export default worker;
