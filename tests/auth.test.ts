import test from 'node:test';
import assert from 'node:assert/strict';
import { lookupDiscordAccess } from '../src/lib/discord-access';
import { createDiscordAuthorization, getDiscordCallbackUrl, verifyAuthSession } from '../src/lib/discord-auth';

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
  for (const status of [401, 403, 429, 500, 503]) assert.equal((await lookupDiscordAccess(user, config, response(status, {}))).status, 'unavailable');
  assert.equal((await lookupDiscordAccess(user, config, response(200, { roles: 'invalid' }))).status, 'unavailable');
  assert.equal((await lookupDiscordAccess(user, config, response(200, { roles: [config.roleId], user: { id: '111111111111111111' } }))).status, 'unavailable');
  assert.deepEqual(await lookupDiscordAccess(user, config, response(404, {})), { status: 'denied', reason: 'not_member' });
});

test('owner access avoids an unnecessary Discord membership request', async () => {
  assert.equal((await lookupDiscordAccess(user, { ...config, ownerId: user }, async () => { throw Error('must not fetch'); })).status, 'allowed');
});

test('Discord OAuth uses the Vercel callback and PKCE', () => {
  const previous = process.env.DISCORD_CLIENT_ID;
  process.env.DISCORD_CLIENT_ID = 'client-id';
  try {
    const { url, transaction } = createDiscordAuthorization('https://www.avrxt.dev/auth/start', '/me/admin');
    assert.equal(url.origin, 'https://discord.com');
    assert.equal(url.searchParams.get('redirect_uri'), 'https://www.avrxt.dev/auth/o1/dc/callback');
    assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
    assert.ok(url.searchParams.get('code_challenge'));
    assert.equal(transaction.next, '/me/admin');
    assert.equal(getDiscordCallbackUrl('http://localhost:3000/auth/start').toString(), 'http://localhost:3000/auth/o1/dc/callback');
  } finally {
    if (previous === undefined) delete process.env.DISCORD_CLIENT_ID;
    else process.env.DISCORD_CLIENT_ID = previous;
  }
});

test('tampered and expired local sessions are rejected', () => {
  const previous = process.env.AUTH_SESSION_SECRET;
  process.env.AUTH_SESSION_SECRET = 'a-test-only-auth-session-secret-with-more-than-32-characters';
  try {
    assert.equal(verifyAuthSession('broken.signature'), null);
    const payload = Buffer.from(JSON.stringify({ id: user, provider: 'discord', exp: 1, user_metadata: {} })).toString('base64url');
    assert.equal(verifyAuthSession(`${payload}.invalid`), null);
  } finally {
    if (previous === undefined) delete process.env.AUTH_SESSION_SECRET;
    else process.env.AUTH_SESSION_SECRET = previous;
  }
});
