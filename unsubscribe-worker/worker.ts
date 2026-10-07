interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  RESEND_API_KEY: string;
}

interface UnsubscribeRecord {
  email: string;
  audience_id: string;
  unsubscribed_at: string | null;
}

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{40,60}$/;
const HTML_HEADERS = {
  'content-type': 'text/html; charset=utf-8',
  'cache-control': 'no-store, max-age=0',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'no-referrer',
  'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
} as const;
const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store, max-age=0',
  'x-content-type-options': 'nosniff',
} as const;

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
  const url = new URL('/rest/v1/newsletter_unsubscribe_tokens', env.SUPABASE_URL);
  url.searchParams.set('token_hash', `eq.${await hashToken(token)}`);
  url.searchParams.set('select', 'email,audience_id,unsubscribed_at');
  url.searchParams.set('limit', '1');
  const response = await fetch(url, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  if (!response.ok) throw new Error(`Supabase lookup failed (${response.status})`);
  const records = await response.json() as UnsubscribeRecord[];
  return records[0] || null;
}

async function unsubscribe(record: UnsubscribeRecord, env: Env) {
  const resendUrl = new URL(
    `/audiences/${encodeURIComponent(record.audience_id)}/contacts/${encodeURIComponent(record.email)}`,
    'https://api.resend.com',
  );
  const resendResponse = await fetch(resendUrl, {
    method: 'PATCH',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ unsubscribed: true }),
  });
  if (!resendResponse.ok) throw new Error(`Resend update failed (${resendResponse.status})`);

  const supabaseUrl = new URL('/rest/v1/newsletter_unsubscribe_tokens', env.SUPABASE_URL);
  supabaseUrl.searchParams.set('email', `eq.${record.email}`);
  supabaseUrl.searchParams.set('unsubscribed_at', 'is.null');
  const dbResponse = await fetch(supabaseUrl, {
    method: 'PATCH',
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
    if (!match) return new Response('Not found', { status: 404, headers: { 'cache-control': 'no-store' } });
    if (request.method !== 'GET' && request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: { allow: 'GET, POST', 'cache-control': 'no-store' } });
    }

    // Issued keys are URL-safe base64, so decoding is unnecessary and malformed
    // percent escapes should simply fail validation instead of causing a 500.
    const token = match[1];
    if (!TOKEN_PATTERN.test(token)) return page('Link unavailable', 'This unsubscribe link is invalid or expired. You can close this page.');

    try {
      const record = await findRecord(token, env);
      if (!record) return page('Link unavailable', 'This unsubscribe link is invalid or expired. You can close this page.');
      if (request.method === 'POST' && !record.unsubscribed_at) {
        await unsubscribe(record, env);
        return page('You’re unsubscribed', 'You will no longer receive avrxt newsletter broadcasts.', '', true);
      }
      if (record.unsubscribed_at) return page('You’re unsubscribed', 'You will no longer receive avrxt newsletter broadcasts.', '', true);
      return page('Leave the mailing list?', 'Confirm below and we’ll stop sending avrxt newsletter broadcasts to this address.', token);
    } catch (error) {
      console.error('[NEWSLETTER_UNSUBSCRIBE_FAILED]', error);
      if (request.method === 'POST') return json(503, { error: 'EMAIL_PREFERENCE_UPDATE_FAILED' });
      return new Response('We could not load your email preferences. Please try again later.', {
        status: 503,
        headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
      });
    }
  },
} satisfies { fetch(request: Request, env: Env): Promise<Response> };
