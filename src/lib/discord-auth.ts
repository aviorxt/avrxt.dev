import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { configuredRedis } from '@/lib/redis-rest';

const SESSION_COOKIE = 'avrxt_session';
const CALLBACK_PATH = '/auth/discord/callback';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export type AuthUser = {
  id: string;
  email?: string;
  provider: 'discord';
  admin: boolean;
  user_metadata: { full_name?: string; user_name?: string; avatar_url?: string };
  sessionId?: string;
};

type Transaction = { state: string; verifier: string; next: string; returnOrigin?: string };
type Session = AuthUser & { exp: number };
type DiscordExchange = { user: AuthUser; accessToken: string };

function authSecret() {
  const value = process.env.AUTH_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('AUTH_SESSION_SECRET must contain at least 32 characters.');
  return value;
}

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function sign(value: string) {
  return createHmac('sha256', authSecret()).update(value).digest('base64url');
}

function accessTokenKey(sessionId: string) {
  return `${process.env.REDIS_CACHE_NAMESPACE || 'avrxt'}:auth:discord:${sessionId}`;
}

function encryptAccessToken(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', createHash('sha256').update(authSecret()).digest(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`;
}

function decryptAccessToken(value: string) {
  try {
    const [iv, tag, encrypted] = value.split('.');
    if (!iv || !tag || !encrypted) return null;
    const decipher = createDecipheriv('aes-256-gcm', createHash('sha256').update(authSecret()).digest(), Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64url')), decipher.final()]).toString('utf8');
  } catch { return null; }
}

function callbackOrigin(requestUrl: string) {
  const request = new URL(requestUrl);
  if (request.hostname === 'localhost' || request.hostname === '127.0.0.1') return request.origin;
  return process.env.AUTH_CALLBACK_ORIGIN || 'https://www.avrxt.dev';
}

export function getDiscordCallbackUrl(requestUrl: string) {
  return new URL(CALLBACK_PATH, callbackOrigin(requestUrl));
}

export function createDiscordAuthorization(requestUrl: string, next: string) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) throw new Error('DISCORD_CLIENT_ID is not configured.');
  const state = randomBytes(32).toString('base64url');
  const verifier = randomBytes(48).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const url = new URL('https://discord.com/oauth2/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', getDiscordCallbackUrl(requestUrl).toString());
  url.searchParams.set('response_type', 'code');
  // This user-consented scope lets AVRXT verify only the current user's role
  // in the configured guild. No Discord bot account is required.
  url.searchParams.set('scope', 'identify guilds.members.read');
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  return { url, transaction: { state, verifier, next } as Transaction };
}

export function trustedVaultOrigin(value: unknown) {
  return value === 'https://vault.avrxt.dev' ? value : undefined;
}

function sessionCookieDomain() {
  const value = process.env.AUTH_COOKIE_DOMAIN;
  return value && /^\.[a-z0-9.-]+$/i.test(value) ? value : undefined;
}

export async function exchangeDiscordCode(code: string, verifier: string, requestUrl: string): Promise<DiscordExchange> {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Discord OAuth is not configured.');
  const token = await fetch('https://discord.com/api/v10/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: 'authorization_code', code, code_verifier: verifier, redirect_uri: getDiscordCallbackUrl(requestUrl).toString() }),
    cache: 'no-store', signal: AbortSignal.timeout(10_000),
  });
  if (!token.ok) throw new Error('Discord rejected the authorization code.');
  const tokenBody = await token.json() as { access_token?: unknown };
  if (typeof tokenBody.access_token !== 'string' || !tokenBody.access_token) throw new Error('Discord returned an invalid token response.');
  const profile = await fetch('https://discord.com/api/v10/users/@me', {
    headers: { Authorization: `Bearer ${tokenBody.access_token}`, Accept: 'application/json' },
    cache: 'no-store', signal: AbortSignal.timeout(5_000),
  });
  if (!profile.ok) throw new Error('Discord profile lookup failed.');
  const body = await profile.json() as { id?: unknown; username?: unknown; global_name?: unknown; avatar?: unknown };
  if (typeof body.id !== 'string' || !/^\d{5,}$/.test(body.id)) throw new Error('Discord profile was invalid.');
  const name = typeof body.global_name === 'string' ? body.global_name : typeof body.username === 'string' ? body.username : undefined;
  const avatar = typeof body.avatar === 'string' ? `https://cdn.discordapp.com/avatars/${body.id}/${body.avatar}.png` : undefined;
  return { user: { id: body.id, provider: 'discord', admin: false, user_metadata: { full_name: name, user_name: typeof body.username === 'string' ? body.username : undefined, avatar_url: avatar } }, accessToken: tokenBody.access_token };
}

export async function setAuthSession(user: AuthUser, accessToken: string) {
  const sessionId = randomBytes(24).toString('base64url');
  const redis = configuredRedis();
  if (!redis) throw new Error('Discord authorization storage is unavailable.');
  await redis.command('SET', accessTokenKey(sessionId), encryptAccessToken(accessToken), 'EX', SESSION_MAX_AGE_SECONDS);
  const payload: Session = { ...user, sessionId, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS };
  const encoded = encode(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, `${encoded}.${sign(encoded)}`, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: SESSION_MAX_AGE_SECONDS, domain: sessionCookieDomain() });
}

export async function clearAuthSession() {
  const store = await cookies();
  const user = verifyAuthSession(store.get(SESSION_COOKIE)?.value);
  const redis = configuredRedis();
  if (user?.sessionId && redis) await redis.command('DEL', accessTokenKey(user.sessionId)).catch(() => {});
  store.delete({ name: SESSION_COOKIE, path: '/', domain: sessionCookieDomain() });
}

export async function getDiscordSessionAccessToken(user: AuthUser) {
  if (!user.sessionId) return undefined;
  const redis = configuredRedis();
  if (!redis) return undefined;
  try {
    const encrypted = await redis.command<string | null>('GET', accessTokenKey(user.sessionId));
    return typeof encrypted === 'string' ? decryptAccessToken(encrypted) || undefined : undefined;
  } catch { return undefined; }
}

export function verifyAuthSession(raw: string | undefined): AuthUser | null {
  if (!raw) return null;
  const [encoded, received] = raw.split('.');
  if (!encoded || !received) return null;
  const expected = sign(encoded);
  if (received.length !== expected.length || !timingSafeEqual(Buffer.from(received), Buffer.from(expected))) return null;
  try {
    const value = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as Partial<Session>;
    if (value.provider !== 'discord' || typeof value.id !== 'string' || !/^\d{5,}$/.test(value.id) || typeof value.exp !== 'number' || value.exp <= Math.floor(Date.now() / 1000)) return null;
    const metadata = value.user_metadata && typeof value.user_metadata === 'object' ? value.user_metadata : {};
    return { id: value.id, provider: 'discord', admin: false, sessionId: typeof value.sessionId === 'string' && /^[A-Za-z0-9_-]{20,}$/.test(value.sessionId) ? value.sessionId : undefined, user_metadata: { full_name: typeof metadata.full_name === 'string' ? metadata.full_name : undefined, user_name: typeof metadata.user_name === 'string' ? metadata.user_name : undefined, avatar_url: typeof metadata.avatar_url === 'string' ? metadata.avatar_url : undefined } };
  } catch { return null; }
}

export const getAuthUser = cache(async (): Promise<AuthUser | null> => verifyAuthSession((await cookies()).get(SESSION_COOKIE)?.value));
