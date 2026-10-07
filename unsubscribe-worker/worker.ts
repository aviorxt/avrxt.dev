interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
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
  'referrer-policy': 'no-referrer',
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
const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
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

function page(title: string, message: string, token = '', complete = false) {
  const button = token && !complete
    ? `<form method="post" action="/mail/${encodeURIComponent(token)}"><button type="submit">Unsubscribe</button></form>`
    : '';
  return new Response(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="dark"><title>${title} | avrxt</title>
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;min-height:100svh;display:grid;place-items:center;padding:24px;background:#070707;color:#f5f5f5;font:16px/1.6 system-ui,sans-serif}.card{width:min(100%,480px);padding:clamp(28px,7vw,44px);border:1px solid #292929;border-radius:24px;background:linear-gradient(145deg,#111,#090909);text-align:center;box-shadow:0 24px 80px #0008}.mark{display:grid;place-items:center;width:56px;height:56px;margin:0 auto 24px;border:1px solid #333;border-radius:18px;color:#ddd;font-size:24px}.eyebrow{margin:0 0 10px;color:#777;font:11px/1.5 ui-monospace,monospace;letter-spacing:.22em;text-transform:uppercase}h1{margin:0;font-size:clamp(24px,7vw,32px);line-height:1.15;letter-spacing:-.04em}p{max-width:360px;margin:14px auto 0;color:#999;font-size:14px}button{min-height:48px;margin-top:28px;padding:0 22px;border:0;border-radius:12px;background:#f5f5f5;color:#080808;font:600 14px system-ui,sans-serif;cursor:pointer}button:hover{background:#ddd}a{color:#aaa}.brand{margin:30px 0 0;color:#555;font-size:11px}
</style></head><body><main class="card"><div class="mark" aria-hidden="true">${complete ? '✓' : '✉'}</div><p class="eyebrow">avrxt / email preferences</p><h1>${title}</h1><p>${message}</p>${button}<p class="brand">avrxt.dev</p></main></body></html>`, {
    status: 200,
    headers: HTML_HEADERS,
  });
}

function json(status: number, body: Record<string, boolean | string>) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

async function hashToken(token: string) {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function findRecord(token: string, env: Env): Promise<UnsubscribeRecord | null> {
  if (!TOKEN_PATTERN.test(token)) return null;
  const baseUrl = new URL(env.SUPABASE_URL);
  if (baseUrl.protocol !== 'https:' || !baseUrl.hostname.endsWith('.supabase.co') || baseUrl.username || baseUrl.password) {
    throw new Error('Supabase endpoint configuration is invalid');
  }
  const url = new URL('/rest/v1/newsletter_unsubscribe_tokens', baseUrl);
  url.searchParams.set('token_hash', `eq.${await hashToken(token)}`);
  url.searchParams.set('select', 'email,audience_id,unsubscribed_at');
  url.searchParams.set('limit', '1');
  const response = await fetch(url, {
    redirect: 'error',
    signal: AbortSignal.timeout(8_000),
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      accept: 'application/json',
    },
  });
  if (!response.ok) throw new Error(`Supabase lookup failed (${response.status})`);
  const records = await response.json() as unknown;
  if (!Array.isArray(records)) throw new Error('Supabase returned an invalid lookup response');
  const record = records[0] as Partial<UnsubscribeRecord> | undefined;
  if (!record) return null;
  if (
    typeof record.email !== 'string' || record.email.length > 320 || !EMAIL_PATTERN.test(record.email) ||
    typeof record.audience_id !== 'string' || !AUDIENCE_ID_PATTERN.test(record.audience_id) ||
    (record.unsubscribed_at !== null && typeof record.unsubscribed_at !== 'string')
  ) {
    throw new Error('Supabase returned an invalid unsubscribe record');
  }
  return record as UnsubscribeRecord;
}

async function unsubscribe(record: UnsubscribeRecord, env: Env) {
  if (record.audience_id !== TEST_AUDIENCE_ID) {
    const resendUrl = new URL(
      `/audiences/${encodeURIComponent(record.audience_id)}/contacts/${encodeURIComponent(record.email)}`,
      'https://api.resend.com',
    );
    const resendResponse = await fetch(resendUrl, {
      method: 'PATCH',
      redirect: 'error',
      signal: AbortSignal.timeout(8_000),
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ unsubscribed: true }),
    });
    if (!resendResponse.ok) throw new Error(`Resend update failed (${resendResponse.status})`);
  }

  const supabaseUrl = new URL('/rest/v1/newsletter_unsubscribe_tokens', env.SUPABASE_URL);
  supabaseUrl.searchParams.set('email', `eq.${record.email}`);
  supabaseUrl.searchParams.set('audience_id', `eq.${record.audience_id}`);
  supabaseUrl.searchParams.set('unsubscribed_at', 'is.null');
  const dbResponse = await fetch(supabaseUrl, {
    method: 'PATCH',
    redirect: 'error',
    signal: AbortSignal.timeout(8_000),
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'content-type': 'application/json',
      prefer: 'return=minimal',
    },
    body: JSON.stringify({ unsubscribed_at: new Date().toISOString() }),
  });
  if (!dbResponse.ok) throw new Error(`Supabase update failed (${dbResponse.status})`);
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
      console.error('[NEWSLETTER_UNSUBSCRIBE_FAILED]', error instanceof Error ? error.name : 'unknown');
      if (request.method === 'POST') return json(503, { error: 'EMAIL_PREFERENCE_UPDATE_FAILED' });
      return plainText(503, 'We could not load your email preferences. Please try again later.');
    }
  },
} satisfies { fetch(request: Request, env: Env): Promise<Response> };
