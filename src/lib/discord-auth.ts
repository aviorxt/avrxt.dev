import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { cache } from 'react';

const SESSION_COOKIE = 'avrxt_session';
const CALLBACK_PATH = '/auth/o1/dc/callback';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export type AuthUser = {
  id: string;
  email?: string;
  provider: 'discord';
  admin: boolean;
  user_metadata: { full_name?: string; user_name?: string; avatar_url?: string };
};

type Transaction = { state: string; verifier: string; next: string };
type Session = AuthUser & { exp: number };

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
  url.searchParams.set('scope', 'identify');
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  return { url, transaction: { state, verifier, next } satisfies Transaction };
}

export async function exchangeDiscordCode(code: string, verifier: string, requestUrl: string): Promise<AuthUser> {
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
  return { id: body.id, provider: 'discord', admin: false, user_metadata: { full_name: name, user_name: typeof body.username === 'string' ? body.username : undefined, avatar_url: avatar } };
}

export async function setAuthSession(user: AuthUser) {
  const payload: Session = { ...user, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS };
  const encoded = encode(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, `${encoded}.${sign(encoded)}`, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: SESSION_MAX_AGE_SECONDS });
}

export async function clearAuthSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
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
    return { id: value.id, provider: 'discord', admin: false, user_metadata: { full_name: typeof metadata.full_name === 'string' ? metadata.full_name : undefined, user_name: typeof metadata.user_name === 'string' ? metadata.user_name : undefined, avatar_url: typeof metadata.avatar_url === 'string' ? metadata.avatar_url : undefined } };
  } catch { return null; }
}

export const getAuthUser = cache(async (): Promise<AuthUser | null> => verifyAuthSession((await cookies()).get(SESSION_COOKIE)?.value));
