import test from 'node:test';
import assert from 'node:assert/strict';
import { lookupDiscordAccess } from '../src/lib/discord-access';
import { getOpenAuthClient } from '../src/lib/openauth';
import proxy from '../src/proxy';
import { NextRequest } from 'next/server';
import { GET as startLogin } from '../src/app/auth/start/route';
import { GET as callbackLogin } from '../src/app/auth/callback/route';

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
