import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import worker from '../unsubscribe-worker/worker';

const token = 'a'.repeat(43), url = `https://unsub.avrxt.dev/mail/${token}`;
const record = { email: 'fixture@example.com', audience_id: 'fixture-audience', unsubscribed_at: null as string | null };
const env = () => ({ SUPABASE_URL: 'https://fixture.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_fixture_backend_key', RESEND_API_KEY: 're_fixture', REQUEST_LIMITER: { limit: async () => ({ success: true }) }, UNSUBSCRIBE_LIMITER: { limit: async () => ({ success: true }) } });
const post = (headers: Record<string, string> = {}, body = '') => new Request(url, { method: 'POST', headers: { origin: 'https://unsub.avrxt.dev', 'sec-fetch-site': 'same-origin', ...headers }, body });

test('unsubscribe GET reads the hashed token with modern apikey auth without changing preferences', async () => {
  const previous = globalThis.fetch; let reads = 0;
  globalThis.fetch = async (input, options) => {
    assert.equal(typeof input, 'string', 'Worker fetch uses an explicit URL string');
    reads++; const target = new URL(String(input));
    assert.equal(options?.method || 'GET', 'GET');
    assert.equal(target.searchParams.get('token_hash'), `eq.${createHash('sha256').update(token).digest('hex')}`);
    assert.ok(!String(input).includes(token));
    const headers = new Headers(options?.headers); assert.equal(headers.get('apikey'), env().SUPABASE_SERVICE_ROLE_KEY); assert.equal(headers.get('authorization'), null);
    return Response.json([record]);
  };
  try {
    const response = await worker.fetch(new Request(url), env());
    assert.equal(response.status, 200); assert.equal(response.headers.get('referrer-policy'), 'same-origin');
    const html = await response.text(); assert.match(html, /Leave the mailing list/); assert.match(html, /<form method="post"/); assert.doesNotMatch(html, /fixture@example/); assert.equal(reads, 1);
  } finally { globalThis.fetch = previous; }
});
test('legacy service-role JWTs work, while anonymous keys and project mismatch fail before a database request', async () => {
  const previous = globalThis.fetch, log = console.error; let reads = 0;
  const jwt = (role: string, ref = 'fixture') => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ role, ref })).toString('base64url')}.fixture-signature`;
  console.error = () => {};
  globalThis.fetch = async (_input, options) => { reads++; assert.equal(new Headers(options?.headers).get('authorization'), `Bearer ${jwt('service_role')}`); return Response.json([record]); };
  try {
    assert.equal((await worker.fetch(new Request(url), { ...env(), SUPABASE_SERVICE_ROLE_KEY: jwt('service_role') })).status, 200);
    for (const key of [jwt('anon'), jwt('service_role', 'other-project'), 'sb_publishable_fixture', '']) {
      assert.equal((await worker.fetch(new Request(url), { ...env(), SUPABASE_SERVICE_ROLE_KEY: key })).status, 503);
    }
    assert.equal(reads, 1);
  } finally { globalThis.fetch = previous; console.error = log; }
});
test('explicit same-origin POST updates Resend first and marks records only after provider success', async () => {
  const previous = globalThis.fetch; const calls: Array<{ target: URL; options?: RequestInit }> = [];
  globalThis.fetch = async (input, options) => { const target = new URL(String(input)); calls.push({ target, options }); return !options?.method ? Response.json([record]) : new Response(null, { status: 204 }); };
  try {
    const response = await worker.fetch(post(), env());
    assert.equal(response.status, 200); assert.match(await response.text(), /You’re unsubscribed/);
    assert.equal(calls.length, 3); assert.equal(calls[1].target.hostname, 'api.resend.com'); assert.equal(calls[1].options?.method, 'PATCH');
    assert.deepEqual(JSON.parse(String(calls[1].options?.body)), { unsubscribed: true });
    assert.equal(calls[2].target.searchParams.get('email'), 'eq.fixture@example.com'); assert.equal(calls[2].target.searchParams.get('audience_id'), 'eq.fixture-audience'); assert.equal(calls[2].target.searchParams.get('unsubscribed_at'), 'is.null');
    assert.equal(new Headers(calls[2].options?.headers).get('authorization'), null);
  } finally { globalThis.fetch = previous; }
});
test('missing, invalid and already-completed links never issue a subscription write', async () => {
  const previous = globalThis.fetch; let calls = 0;
  globalThis.fetch = async (_input, options) => { calls++; assert.equal(options?.method || 'GET', 'GET'); return Response.json(calls === 1 ? [] : [{ ...record, unsubscribed_at: new Date().toISOString() }]); };
  try {
    assert.match(await (await worker.fetch(new Request(url), env())).text(), /Link unavailable/);
    assert.match(await (await worker.fetch(post(), env())).text(), /You’re unsubscribed/);
    assert.match(await (await worker.fetch(new Request('https://unsub.avrxt.dev/mail/invalid'), env())).text(), /Link unavailable/);
    assert.equal(calls, 2);
  } finally { globalThis.fetch = previous; }
});
test('cross-site, opaque-origin and streamed oversized POSTs are rejected before touching providers', async () => {
  const previous = globalThis.fetch; let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error('Unexpected write'); };
  try {
    const rejected: Array<Record<string, string>> = [{ origin: 'null' }, { origin: 'https://evil.example' }, { 'sec-fetch-site': 'cross-site' }];
    for (const headers of rejected) assert.equal((await worker.fetch(post(headers), env())).status, 403);
    assert.equal((await worker.fetch(post({}, 'x'.repeat(1025)), env())).status, 413);
    assert.equal(calls, 0);
  } finally { globalThis.fetch = previous; }
});
test('provider failures return a retryable HTML page and log only sanitized diagnostics', async () => {
  const previous = globalThis.fetch, log = console.error; const logs: unknown[][] = [];
  console.error = (...args) => { logs.push(args); };
  globalThis.fetch = async () => Response.json({ code: 'PGRST301', message: `${token} fixture@example.com sb_secret_fixture_backend_key private-error` }, { status: 401 });
  try {
    const response = await worker.fetch(new Request(url), env());
    assert.equal(response.status, 503); assert.match(response.headers.get('content-type')!, /text\/html/);
    assert.match(await response.text(), /Try again/);
    const serialized = JSON.stringify(logs); assert.match(serialized, /database_lookup/); assert.match(serialized, /PGRST301/);
    for (const value of [token, record.email, env().SUPABASE_SERVICE_ROLE_KEY, 'private-error']) assert.ok(!serialized.includes(value));
    let writes = 0;
    globalThis.fetch = async (input, options) => { if (!options?.method) return Response.json([record]); writes++; assert.equal(new URL(String(input)).hostname, 'api.resend.com'); return Response.json({ message: 'private provider error' }, { status: 503 }); };
    const failedUpdate = await worker.fetch(post(), env()); assert.equal(failedUpdate.status, 503); assert.equal(writes, 1);
  } finally { globalThis.fetch = previous; console.error = log; }
});
test('test links exercise the confirmation flow without contacting Resend, and limits block before writes', async () => {
  const previous = globalThis.fetch; let calls = 0;
  globalThis.fetch = async (input, options) => { calls++; assert.equal(new URL(String(input)).hostname, 'fixture.supabase.co'); return options?.method ? new Response(null, { status: 204 }) : Response.json([{ ...record, audience_id: '__avrxt_test__' }]); };
  try {
    assert.match(await (await worker.fetch(post(), env())).text(), /Your newsletter subscription was not changed/); assert.equal(calls, 2);
    assert.equal((await worker.fetch(post(), { ...env(), UNSUBSCRIBE_LIMITER: { limit: async () => ({ success: false }) } })).status, 429);
    assert.equal(calls, 2);
  } finally { globalThis.fetch = previous; }
});
test('database redirects follow the same project only and never forward credentials to another host', async () => {
  const previous = globalThis.fetch, log = console.error; let calls = 0;
  console.error = () => {};
  globalThis.fetch = async input => { calls++; return calls === 1 ? new Response(null, { status: 308, headers: { location: '/rest/v1/newsletter_unsubscribe_tokens/' } }) : Response.json([record]); };
  try {
    assert.equal((await worker.fetch(new Request(url), env())).status, 200); assert.equal(calls, 2);
    calls = 0;
    globalThis.fetch = async () => { calls++; return new Response(null, { status: 307, headers: { location: 'https://evil.example/collect' } }); };
    assert.equal((await worker.fetch(new Request(url), env())).status, 503); assert.equal(calls, 1);
  } finally { globalThis.fetch = previous; console.error = log; }
});
