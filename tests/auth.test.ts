import test from 'node:test';
import assert from 'node:assert/strict';
import { lookupDiscordAccess } from '../src/lib/discord-access';
import { getOpenAuthClient } from '../src/lib/openauth';
import proxy from '../src/proxy';
import { NextRequest } from 'next/server';
import { GET as startLogin } from '../src/app/auth/start/route';
import { GET as callbackLogin } from '../src/app/auth/callback/route';
import { authStorage, minimalAuthRecord } from '../auth-worker/storage';
import { cleanupAuthNamespace } from '../auth-worker/cleanup';

const user = '1269352892146384957';
const config = { guildId: '1554095197959491595', roleId: '1557908876538683402', botToken: 'test-token' };
function response(status: number, data: unknown): typeof fetch { return async () => new Response(JSON.stringify(data), { status }); }

test('current membership accepts the exact role and observes role revocation without stale caching', async () => {
  let roles = [config.roleId];
  const request: typeof fetch = async (_url, options) => {
    assert.equal(options?.cache, 'no-store');
    assert.equal(new Headers(options?.headers).get('authorization'), 'Bot test-token');
    return new Response(JSON.stringify({ roles, user: { id: user } }));
  };
  assert.equal((await lookupDiscordAccess(user, config, request)).status, 'allowed');
  roles = [];
  assert.deepEqual(await lookupDiscordAccess(user, config, request), { status: 'denied', reason: 'role_missing' });
});
test('provider errors never masquerade as a missing role and never grant access', async () => {
  for (const status of [401,403,429,500,503]) {
    assert.equal((await lookupDiscordAccess(user, config, response(status, {}))).status, 'unavailable');
  }
  assert.equal((await lookupDiscordAccess(user, config, response(200, { roles: 'invalid' }))).status, 'unavailable');
  assert.equal((await lookupDiscordAccess(user, config, response(200, { roles: [config.roleId], user: { id: '111111111111111111' } }))).status, 'unavailable');
  assert.deepEqual(await lookupDiscordAccess(user, config, response(404, {})), { status: 'denied', reason: 'not_member' });
  assert.equal((await lookupDiscordAccess(user, { ...config, roleId: '' }, response(200, {}))).status, 'unavailable');
});
test('owner access avoids an unnecessary Discord membership request; unrelated users still require a role', async () => {
  const ownerConfig = { ...config, ownerId: ` ${user} ` };
  assert.equal((await lookupDiscordAccess(user, ownerConfig, async () => { throw Error('must not fetch'); })).status, 'allowed');
  assert.equal((await lookupDiscordAccess('111111111111111111', ownerConfig, response(200, { roles: [] }))).status, 'denied');
});
test('OAuth-to-bot fallback shares one deadline and handles permission errors', async () => {
  let firstSignal: AbortSignal | null | undefined; let calls = 0;
  const request: typeof fetch = async (_url, options) => {
    calls++;
    if (calls === 1) { firstSignal = options?.signal; return new Response('{}', { status: 403 }); }
    assert.equal(options?.signal, firstSignal);
    return new Response(JSON.stringify({ roles: [config.roleId] }));
  };
  assert.equal((await lookupDiscordAccess(user, { ...config, providerToken: 'oauth-test' }, request)).status, 'allowed');
  assert.equal(calls, 2);
});
test('OpenAuth discovery/JWKS client is reused and switches when the issuer changes', () => {
  const old = process.env.OPENAUTH_ISSUER_URL;
  try {
    process.env.OPENAUTH_ISSUER_URL = 'https://auth.avrxt.dev';
    const first = getOpenAuthClient();
    assert.equal(first, getOpenAuthClient());
    process.env.OPENAUTH_ISSUER_URL = 'https://other.example';
    assert.notEqual(first, getOpenAuthClient());
  } finally {
    if (old === undefined) delete process.env.OPENAUTH_ISSUER_URL;
    else process.env.OPENAUTH_ISSUER_URL = old;
  }
});

test('proxy forwards refreshed cookies to the render and persists them for the browser', async () => {
  const client = getOpenAuthClient(); const original = client.verify;
  client.verify = (async () => ({ aud: 'avrxt-web', subject: { type: 'user', properties: {} },
    tokens: { access: 'new-access', refresh: 'new-refresh', expiresIn: 900 } })) as typeof client.verify;
  try {
    const result = await proxy(new NextRequest('https://www.avrxt.dev/me/admin', {
      headers: { cookie: 'avrxt_access=old-access; avrxt_refresh=old-refresh; unrelated=keep' },
    }));
    assert.equal(result.cookies.get('avrxt_access')?.value, 'new-access');
    assert.equal(result.cookies.get('avrxt_refresh')?.value, 'new-refresh');
    const forwarded = result.headers.get('x-middleware-request-cookie')!;
    assert.match(forwarded, /avrxt_access=new-access/);
    assert.match(forwarded, /avrxt_refresh=new-refresh/);
    assert.match(forwarded, /unrelated=keep/);
    assert.doesNotMatch(forwarded, /old-access|old-refresh/);
  } finally { client.verify = original; }
});

test('callback service timeout redirects to a fresh-login message instead of HTTP 500', async () => {
  const started = await startLogin(new NextRequest('http://localhost:3000/auth/start?provider=discord&next=%2Fme%2Fadmin'));
  const cookie = started.cookies.get('avrxt_oauth_transaction')!;
  const transaction = JSON.parse(cookie.value);
  const client = getOpenAuthClient(); const original = client.exchange;
  client.exchange = async () => { throw new DOMException('timeout', 'TimeoutError'); };
  try {
    const result = await callbackLogin(new NextRequest(`http://localhost:3000/auth/callback?next=%2Fme%2Fadmin&code=test-only-code&state=${transaction.state}`, {
      headers: { cookie: `avrxt_oauth_transaction=${encodeURIComponent(cookie.value)}` },
    }));
    assert.equal(result.status, 307);
    assert.match(result.headers.get('location')!, /oauth_service_unavailable/);
    assert.equal(result.cookies.get('avrxt_oauth_transaction')?.value, '');
    assert.equal(result.cookies.get('avrxt_access'), undefined);
  } finally { client.exchange = original; }
});

test('auth storage scans preserve keys, pagination and expired-entry filtering with bounded parallel reads', async () => {
  const separator = String.fromCharCode(31);
  let running = 0; let peak = 0; let lists = 0;
  const namespace = {
    async list(options: { prefix: string; cursor?: string }) {
      assert.equal(options.prefix, `signing:key${separator}`); lists++;
      const start = options.cursor ? 25 : 0; const count = options.cursor ? 3 : 25;
      return { keys: Array.from({ length: count }, (_, i) => ({ name: `signing:key${separator}${start+i}` })),
        list_complete: Boolean(options.cursor), cursor: options.cursor ? undefined : 'page-two' };
    },
    async get(name: string) {
      running++; peak = Math.max(peak, running);
      await new Promise(resolve => setTimeout(resolve, 1)); running--;
      return name.endsWith(`${separator}4`) ? null : { name };
    },
  };
  const keys = [];
  for await (const [key, value] of authStorage(namespace as unknown as Parameters<typeof authStorage>[0]).scan(['signing:key'])) keys.push({ key, value });
  assert.equal(keys.length, 27);
  assert.equal(lists, 2);
  assert.ok(peak > 1 && peak <= 20);
  assert.deepEqual(keys[0].key, ['signing:key', '0']);
  assert.deepEqual(keys.at(-1)?.key, ['signing:key', '27']);
});

test('auth records omit profile data while preserving the authorization and refresh protocol', () => {
  const value = { subject: 'opaque', ttl: { refresh: 30 }, pkce: { challenge: 'test' }, nextToken: 'test-next',
    properties: { id: user, provider: 'discord', admin: true, email: 'private@example.com', name: 'Private', avatar: 'private-url' } };
  const minimal = minimalAuthRecord(['oauth:refresh', 'opaque'], value);
  assert.deepEqual(minimal.properties, { id: user, provider: 'discord', admin: true });
  assert.equal(minimal.subject, value.subject);
  assert.deepEqual(minimal.pkce, value.pkce);
  assert.equal(minimal.nextToken, value.nextToken);
  assert.equal(minimalAuthRecord(['signing:key'], value), value);
});

test('namespace cleanup preserves current keys and sessions, minimizes legacy identity and deletes only proven-expired records', async () => {
  const separator = String.fromCharCode(31); const now = Date.now();
  const records = new Map<string, { value: unknown; metadata?: { retiredAt?: number; expiresAt?: number }; expiration?: number }>([
    [`signing:key${separator}newest`, { value: { created: now } }],
    [`signing:key${separator}backup`, { value: { created: now-1 } }],
    [`signing:key${separator}retire`, { value: { created: now-2 } }],
    [`signing:key${separator}old-retired`, { value: { created: now-3 }, metadata: { retiredAt: now-32*86400_000 } }],
    [`oauth:refresh${separator}active`, { value: { subject: 'active', properties: { id: user, provider: 'discord', admin: true, email: 'private@example.com' } }, expiration: Math.floor(now/1000)+3600 }],
    [`oauth:code${separator}expired`, { value: {}, metadata: { expiresAt: now-1 } }],
    ['unknown-record', { value: { preserve: true } }],
  ]);
  const namespace = {
    async list(options: { prefix?: string }) {
      return { keys: [...records].filter(([name]) => !options.prefix || name.startsWith(options.prefix))
        .map(([name, record]) => ({ name, metadata: record.metadata, expiration: record.expiration })), list_complete: true };
    },
    async get(name: string, type?: string) { const value = records.get(name)?.value; return type === 'json' ? value ?? null : value ? String(value) : null; },
    async put(name: string, raw: string, options?: { metadata?: { retiredAt?: number; expiresAt?: number }; expirationTtl?: number }) {
      records.set(name, { value: name === 'avrxt:cleanup:cursor' ? raw : JSON.parse(raw), metadata: options?.metadata,
        expiration: options?.expirationTtl ? Math.floor(now/1000)+options.expirationTtl : undefined });
    },
    async delete(name: string) { records.delete(name); },
  };
  const counts = await cleanupAuthNamespace(namespace as unknown as Parameters<typeof cleanupAuthNamespace>[0], now);
  assert.equal(counts.removedKeys, 1); assert.equal(counts.retiredKeys, 1);
  assert.equal(counts.removedExpired, 1); assert.equal(counts.minimized, 1);
  assert.ok(records.has(`signing:key${separator}newest`));
  assert.ok(records.has(`signing:key${separator}backup`));
  assert.equal(records.get(`signing:key${separator}retire`)?.metadata?.retiredAt, now);
  assert.ok(records.has('unknown-record'));
  const active = records.get(`oauth:refresh${separator}active`)!;
  assert.equal(active.expiration, Math.floor(now/1000)+3600);
  assert.equal(JSON.stringify(active.value).includes('private@example.com'), false);
});
