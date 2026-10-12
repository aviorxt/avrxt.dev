interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_SECRET_KEY?: string;
  RESEND_API_KEY: string;
  REQUEST_LIMITER: RateLimiter;
  UNSUBSCRIBE_LIMITER: RateLimiter;
}

interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

interface UnsubscribeRecord {
  email: string;
  audience_id: string;
  unsubscribed_at: string | null;
}

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{40,60}$/;
const TEST_AUDIENCE_ID = '__avrxt_test__';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AUDIENCE_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const SECURITY_HEADERS = {
  'cache-control': 'no-store, max-age=0',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  // A same-origin form POST must retain a valid Origin, while external
  // navigations must never receive the private unsubscribe URL.
  'referrer-policy': 'same-origin',
  'strict-transport-security': 'max-age=31536000',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'cross-origin-resource-policy': 'same-origin',
  'cross-origin-opener-policy': 'same-origin',
  'x-permitted-cross-domain-policies': 'none',
  'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'; img-src 'none'; font-src 'none'; connect-src 'none'; object-src 'none'",
} as const;
const HTML_HEADERS = {
  'content-type': 'text/html; charset=utf-8',
  ...SECURITY_HEADERS,
} as const;

function plainText(status: number, body: string, extraHeaders: Record<string, string> = {}) {
  return new Response(body, {
    status,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      ...SECURITY_HEADERS,
      ...extraHeaders,
    },
  });
}

function page(title: string, message: string, token = '', complete = false, status = 200, retry = false) {
  const button = token && !complete
    ? `<form method="post" action="/mail/${encodeURIComponent(token)}"><button type="submit">Unsubscribe</button></form>`
    : '';
  const retryButton = retry && token ? `<a style="display:inline-block;margin-top:28px;padding:12px 22px;border:1px solid #444;border-radius:12px;text-decoration:none;color:#eee" href="/mail/${encodeURIComponent(token)}">Try again</a>` : '';
  return new Response(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="dark"><title>${title} | avrxt</title>
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;min-height:100svh;display:grid;place-items:center;padding:24px;background:#070707;color:#f5f5f5;font:16px/1.6 system-ui,sans-serif}.card{width:min(100%,480px);padding:clamp(28px,7vw,44px);border:1px solid #292929;border-radius:24px;background:linear-gradient(145deg,#111,#090909);text-align:center;box-shadow:0 24px 80px #0008}.mark{display:grid;place-items:center;width:56px;height:56px;margin:0 auto 24px;border:1px solid #333;border-radius:18px;color:#ddd;font-size:24px}.eyebrow{margin:0 0 10px;color:#777;font:11px/1.5 ui-monospace,monospace;letter-spacing:.22em;text-transform:uppercase}h1{margin:0;font-size:clamp(24px,7vw,32px);line-height:1.15;letter-spacing:-.04em}p{max-width:360px;margin:14px auto 0;color:#999;font-size:14px}button{min-height:48px;margin-top:28px;padding:0 22px;border:0;border-radius:12px;background:#f5f5f5;color:#080808;font:600 14px system-ui,sans-serif;cursor:pointer}button:hover{background:#ddd}a{color:#aaa}.brand{margin:30px 0 0;color:#555;font-size:11px}
</style></head><body><main class="card"><div class="mark" aria-hidden="true">${complete ? '✓' : '✉'}</div><p class="eyebrow">avrxt / email preferences</p><h1>${title}</h1><p>${message}</p>${retry ? retryButton : button}<p class="brand">avrxt.dev</p></main></body></html>`, {
    status,
    headers: HTML_HEADERS,
  });
}

class UnsubscribeError extends Error {
  constructor(readonly stage: string, readonly status?: number, readonly code?: string, readonly transport?: string, readonly project?: string, readonly redirectHost?: string) {
    super('Email preferences unavailable');
    this.name = 'UnsubscribeError';
  }
}

async function databaseFetch(url: URL, options: RequestInit, stage: string) {
  const origin = url.origin;
  let target = url;
  for (let hop = 0; hop < 3; hop++) {
    let response: Response;
    try { response = await fetch(target.toString(), { ...options, redirect: 'manual' }); }
    catch (error) { throw connectionError(stage, error); }
    if (![301,302,303,307,308].includes(response.status)) return response;
    const location = response.headers.get('location');
    let next: URL | undefined;
    try { if (location) next = new URL(location, target); } catch { /* reject */ }
    const redirectHost = next && (next.hostname === 'supabase.com' || /^[a-z0-9]+\.supabase\.co$/.test(next.hostname)) ? next.hostname : 'external';
    if (!next || next.origin !== origin || next.username || next.password) throw new UnsubscribeError('database_redirect', response.status, undefined, 'external_redirect', url.hostname.split('.')[0], redirectHost);
    if (options.method && options.method !== 'GET' && ![307,308].includes(response.status)) throw new UnsubscribeError('database_redirect', response.status, undefined, 'unsafe_method');
    target = next;
  }
  throw new UnsubscribeError('database_redirect', undefined, undefined, 'redirect_limit');
}

function connectionError(stage: string, error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  const transport = /header|invalid character/.test(message) ? 'headers'
    : /redirect/.test(message) ? 'redirect'
    : /dns|resolve|hostname|enotfound/.test(message) ? 'dns'
    : /ssl|tls|certificate/.test(message) ? 'tls'
    : /url|request input|parse/.test(message) ? 'request_url'
    : /illegal invocation|different request|i\/o/.test(message) ? 'runtime_context'
    : /abort|timeout/.test(message) ? 'timeout' : 'unknown';
  return new UnsubscribeError(stage, undefined, undefined, transport);
}

function supabaseConnection(env: Env) {
  let baseUrl: URL;
  try { baseUrl = new URL(env.SUPABASE_URL?.trim()); }
  catch { throw new UnsubscribeError('database_configuration'); }
  if (baseUrl.protocol !== 'https:' || !/^[a-z0-9]+\.supabase\.co$/.test(baseUrl.hostname) || baseUrl.port || baseUrl.username || baseUrl.password || baseUrl.search || baseUrl.hash) {
    throw new UnsubscribeError('database_configuration');
  }
  const key = (env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
  if (!key || key.startsWith('sb_publishable_')) throw new UnsubscribeError('database_credentials');
  const headers: Record<string, string> = { apikey: key, accept: 'application/json' };
  // Opaque secret keys are not JWTs. Supplying one as Bearer makes PostgREST
  // reject a valid backend key. Legacy service_role JWTs still use both headers.
  if (!key.startsWith('sb_secret_')) {
    try {
      const parts = key.split('.');
      if (parts.length !== 3) throw new Error();
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as { role?: string; ref?: string };
      if (payload.role !== 'service_role' || (payload.ref && payload.ref !== baseUrl.hostname.split('.')[0])) throw new Error();
    } catch { throw new UnsubscribeError('database_credentials'); }
    headers.authorization = `Bearer ${key}`;
  }
  return { baseUrl, headers };
}

async function providerError(stage: string, response: Response) {
  let code: string | undefined;
  try {
    const body = await response.json() as { code?: unknown };
    if (typeof body.code === 'string' && /^(?:PGRST[0-9]{3}|[0-9A-Z]{5})$/.test(body.code)) code = body.code;
  } catch { /* Status is enough; never retain the provider's message/body. */ }
  return new UnsubscribeError(stage, response.status, code);
}

async function hashToken(token: string) {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function findRecord(token: string, env: Env): Promise<UnsubscribeRecord | null> {
  if (!TOKEN_PATTERN.test(token)) return null;
  const { baseUrl, headers } = supabaseConnection(env);
  const url = new URL('/rest/v1/newsletter_unsubscribe_tokens', baseUrl);
  url.searchParams.set('token_hash', `eq.${await hashToken(token)}`);
  url.searchParams.set('select', 'email,audience_id,unsubscribed_at');
  url.searchParams.set('limit', '1');
  const response = await databaseFetch(url, {
    signal: AbortSignal.timeout(8_000),
    headers,
  }, 'database_fetch');
  if (!response.ok) throw await providerError('database_lookup', response);
  const records = await response.json() as unknown;
  if (!Array.isArray(records)) throw new UnsubscribeError('database_response');
  const record = records[0] as Partial<UnsubscribeRecord> | undefined;
  if (!record) return null;
  if (
    typeof record.email !== 'string' || record.email.length > 320 || !EMAIL_PATTERN.test(record.email) ||
    typeof record.audience_id !== 'string' || !AUDIENCE_ID_PATTERN.test(record.audience_id) ||
    (record.unsubscribed_at !== null && typeof record.unsubscribed_at !== 'string')
  ) {
    throw new UnsubscribeError('database_record');
  }
  return record as UnsubscribeRecord;
}

async function unsubscribe(record: UnsubscribeRecord, env: Env) {
  if (record.audience_id !== TEST_AUDIENCE_ID) {
    const resendUrl = new URL(
      `/audiences/${encodeURIComponent(record.audience_id)}/contacts/${encodeURIComponent(record.email)}`,
      'https://api.resend.com',
    );
    const resendResponse = await fetch(resendUrl.toString(), {
      method: 'PATCH',
      redirect: 'error',
      signal: AbortSignal.timeout(8_000),
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ unsubscribed: true }),
    });
    if (!resendResponse.ok) throw await providerError('subscription_update', resendResponse);
  }

  const { baseUrl, headers } = supabaseConnection(env);
  const supabaseUrl = new URL('/rest/v1/newsletter_unsubscribe_tokens', baseUrl);
  supabaseUrl.searchParams.set('email', `eq.${record.email}`);
  supabaseUrl.searchParams.set('audience_id', `eq.${record.audience_id}`);
  supabaseUrl.searchParams.set('unsubscribed_at', 'is.null');
  const dbResponse = await databaseFetch(supabaseUrl, {
    method: 'PATCH',
    signal: AbortSignal.timeout(8_000),
    headers: {
      ...headers,
      'content-type': 'application/json',
      prefer: 'return=minimal',
    },
    body: JSON.stringify({ unsubscribed_at: new Date().toISOString() }),
  }, 'database_update_connection');
  if (!dbResponse.ok) throw await providerError('database_update', dbResponse);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/mail\/([^/]+)\/?$/);
    const clientIp = request.headers.get('cf-connecting-ip') || 'unknown';
    const requestLimit = await env.REQUEST_LIMITER.limit({ key: clientIp });
    if (!requestLimit.success) return plainText(429, 'Too many requests. Please try again shortly.', { 'retry-after': '60' });

    if (!match) return plainText(404, 'Not found');
    if (request.method !== 'GET' && request.method !== 'POST') {
      return plainText(405, 'Method not allowed', { allow: 'GET, POST' });
    }

    // Issued keys are URL-safe base64, so decoding is unnecessary and malformed
    // percent escapes should simply fail validation instead of causing a 500.
    const token = match[1];
    if (!TOKEN_PATTERN.test(token)) return page('Link unavailable', 'This unsubscribe link is invalid or expired. You can close this page.');

    if (request.method === 'POST') {
      const origin = request.headers.get('origin');
      const fetchSite = request.headers.get('sec-fetch-site');
      const contentLength = Number(request.headers.get('content-length') || 0);
      if ((origin && origin !== url.origin) || fetchSite === 'cross-site' || contentLength > 1_024) {
        return plainText(403, 'Request rejected. Please open the unsubscribe link and try again.');
      }
      // Bound streamed bodies too, even when Content-Length is absent.
      if (request.body) {
        const reader = request.body.getReader(); let size = 0;
        while (true) {
          const { done, value } = await reader.read(); if (done) break;
          size += value.length;
          if (size > 1024) { await reader.cancel(); return plainText(413, 'The request is too large.'); }
        }
      }

      const unsubscribeLimit = await env.UNSUBSCRIBE_LIMITER.limit({ key: clientIp });
      if (!unsubscribeLimit.success) return plainText(429, 'Too many unsubscribe attempts. Please try again shortly.', { 'retry-after': '60' });
    }

    try {
      const record = await findRecord(token, env);
      if (!record) return page('Link unavailable', 'This unsubscribe link is invalid or expired. You can close this page.');
      const isTestLink = record.audience_id === TEST_AUDIENCE_ID;
      if (request.method === 'POST' && !record.unsubscribed_at) {
        await unsubscribe(record, env);
        return isTestLink
          ? page('Test link confirmed', 'The unsubscribe link is working. Your newsletter subscription was not changed.', '', true)
          : page('You’re unsubscribed', 'You will no longer receive avrxt newsletter broadcasts.', '', true);
      }
      if (record.unsubscribed_at) {
        return isTestLink
          ? page('Test link confirmed', 'The unsubscribe link is working. Your newsletter subscription was not changed.', '', true)
          : page('You’re unsubscribed', 'You will no longer receive avrxt newsletter broadcasts.', '', true);
      }
      if (isTestLink) return page('Verify unsubscribe link', 'Confirm below to test this link. Your newsletter subscription will not be changed.', token);
      return page('Leave the mailing list?', 'Confirm below and we’ll stop sending avrxt newsletter broadcasts to this address.', token);
    } catch (error) {
      // No token, email, URL, credentials, provider messages, or response bodies.
      console.error('[NEWSLETTER_UNSUBSCRIBE_FAILED]', error instanceof UnsubscribeError
        ? { stage: error.stage, status: error.status, code: error.code, transport: error.transport, project: error.project, redirectHost: error.redirectHost }
        : { stage: 'provider_connection', kind: error instanceof Error ? error.name : 'unknown' });
      return page('A small interruption', request.method === 'POST'
        ? 'We could not confirm the update. Please try again. Your subscription was not marked as changed unless the service completed it.'
        : 'We could not load your email preferences. Your link is safe to retry; opening it will not unsubscribe you.', token, false, 503, true);
    }
  },
} satisfies { fetch(request: Request, env: Env): Promise<Response> };
