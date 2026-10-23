import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'avrxt_guestbook_session';
const TRANSACTION_COOKIE = 'avrxt_guestbook_oauth';
const CALLBACK_PATH = '/guestbook/auth/callback';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type GuestbookProvider = 'discord' | 'github';
export type GuestbookUser = { id: string; provider: GuestbookProvider; user_metadata: { full_name?: string; user_name?: string; avatar_url?: string } };
type GuestbookSession = GuestbookUser & { exp: number };
export type GuestbookTransaction = { provider: GuestbookProvider; state: string; verifier: string; next: string };

function authSecret() {
  const value = process.env.AUTH_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('AUTH_SESSION_SECRET must contain at least 32 characters.');
  return value;
}
function sign(value: string) { return createHmac('sha256', authSecret()).update(value).digest('base64url'); }
function callbackOrigin(requestUrl: string) {
  const request = new URL(requestUrl);
  return request.hostname === 'localhost' || request.hostname === '127.0.0.1' ? request.origin : process.env.AUTH_CALLBACK_ORIGIN || 'https://www.avrxt.dev';
}
export function guestbookAuthorId(user: Pick<GuestbookUser, 'id' | 'provider'>) { return `${user.provider}:${user.id}`; }
export function getGuestbookCallbackUrl(requestUrl: string) { return new URL(CALLBACK_PATH, callbackOrigin(requestUrl)); }

export function createGuestbookAuthorization(requestUrl: string, provider: GuestbookProvider, next: string) {
  const state = randomBytes(32).toString('base64url');
  const verifier = randomBytes(48).toString('base64url');
  const callback = getGuestbookCallbackUrl(requestUrl).toString();
  if (provider === 'discord') {
    const clientId = process.env.DISCORD_CLIENT_ID;
    if (!clientId) throw new Error('DISCORD_CLIENT_ID is not configured.');
    const url = new URL('https://discord.com/oauth2/authorize');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', callback);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'identify');
    url.searchParams.set('state', state);
    url.searchParams.set('code_challenge', createHash('sha256').update(verifier).digest('base64url'));
    url.searchParams.set('code_challenge_method', 'S256');
    return { url, transaction: { provider, state, verifier, next } satisfies GuestbookTransaction };
  }
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) throw new Error('GITHUB_CLIENT_ID is not configured.');
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', callback);
  url.searchParams.set('scope', 'read:user user:email');
  url.searchParams.set('state', state);
  return { url, transaction: { provider, state, verifier, next } satisfies GuestbookTransaction };
}

export async function exchangeGuestbookCode(code: string, transaction: GuestbookTransaction, requestUrl: string): Promise<GuestbookUser> {
  const callback = getGuestbookCallbackUrl(requestUrl).toString();
  if (transaction.provider === 'discord') {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new Error('Discord OAuth is not configured.');
    const token = await fetch('https://discord.com/api/v10/oauth2/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: 'authorization_code', code, code_verifier: transaction.verifier, redirect_uri: callback }), cache: 'no-store', signal: AbortSignal.timeout(10_000) });
    const tokenBody = await token.json().catch(() => ({})) as { access_token?: unknown };
    if (!token.ok || typeof tokenBody.access_token !== 'string') throw new Error('Discord rejected the authorization code.');
    const profile = await fetch('https://discord.com/api/v10/users/@me', { headers: { Authorization: `Bearer ${tokenBody.access_token}`, Accept: 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(5_000) });
    const body = await profile.json().catch(() => ({})) as { id?: unknown; username?: unknown; global_name?: unknown; avatar?: unknown };
    if (!profile.ok || typeof body.id !== 'string' || !/^\d{5,}$/.test(body.id)) throw new Error('Discord profile lookup failed.');
    const displayName = typeof body.global_name === 'string' ? body.global_name : typeof body.username === 'string' ? body.username : undefined;
    const avatar = typeof body.avatar === 'string' ? `https://cdn.discordapp.com/avatars/${body.id}/${body.avatar}.png` : undefined;
    return { id: body.id, provider: 'discord', user_metadata: { full_name: displayName, user_name: typeof body.username === 'string' ? body.username : undefined, avatar_url: avatar } };
  }
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('GitHub OAuth is not configured.');
  const token = await fetch('https://github.com/login/oauth/access_token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: callback }), cache: 'no-store', signal: AbortSignal.timeout(10_000) });
  const tokenBody = await token.json().catch(() => ({})) as { access_token?: unknown };
  if (!token.ok || typeof tokenBody.access_token !== 'string') throw new Error('GitHub rejected the authorization code.');
  const profile = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${tokenBody.access_token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }, cache: 'no-store', signal: AbortSignal.timeout(5_000) });
  const body = await profile.json().catch(() => ({})) as { id?: unknown; login?: unknown; name?: unknown; avatar_url?: unknown };
  if (!profile.ok || typeof body.id !== 'number' || !Number.isSafeInteger(body.id)) throw new Error('GitHub profile lookup failed.');
  return { id: String(body.id), provider: 'github', user_metadata: { full_name: typeof body.name === 'string' ? body.name : typeof body.login === 'string' ? body.login : undefined, user_name: typeof body.login === 'string' ? body.login : undefined, avatar_url: typeof body.avatar_url === 'string' && body.avatar_url.startsWith('https://') ? body.avatar_url : undefined } };
}

export async function setGuestbookSession(user: GuestbookUser) {
  const payload: GuestbookSession = { ...user, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  (await cookies()).set(SESSION_COOKIE, `${encoded}.${sign(encoded)}`, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: SESSION_MAX_AGE_SECONDS });
}
export async function getGuestbookUser(): Promise<GuestbookUser | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const [encoded, received] = raw.split('.');
  if (!encoded || !received) return null;
  const expected = sign(encoded);
  if (received.length !== expected.length || !timingSafeEqual(Buffer.from(received), Buffer.from(expected))) return null;
  try {
    const value = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as Partial<GuestbookSession>;
    if ((value.provider !== 'discord' && value.provider !== 'github') || typeof value.id !== 'string' || !/^\d+$/.test(value.id) || typeof value.exp !== 'number' || value.exp <= Math.floor(Date.now() / 1000)) return null;
    const metadata = value.user_metadata && typeof value.user_metadata === 'object' ? value.user_metadata : {};
    return { id: value.id, provider: value.provider, user_metadata: { full_name: typeof metadata.full_name === 'string' ? metadata.full_name : undefined, user_name: typeof metadata.user_name === 'string' ? metadata.user_name : undefined, avatar_url: typeof metadata.avatar_url === 'string' ? metadata.avatar_url : undefined } };
  } catch { return null; }
}
export async function setGuestbookTransaction(transaction: GuestbookTransaction) { (await cookies()).set(TRANSACTION_COOKIE, JSON.stringify(transaction), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/guestbook/auth', maxAge: 600 }); }
export async function getGuestbookTransaction() { try { return JSON.parse((await cookies()).get(TRANSACTION_COOKIE)?.value || '{}') as Partial<GuestbookTransaction>; } catch { return {}; } }
export async function clearGuestbookTransaction() { (await cookies()).set(TRANSACTION_COOKIE, '', { path: '/guestbook/auth', maxAge: 0 }); }
