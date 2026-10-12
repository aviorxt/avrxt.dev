import { createClient } from '@openauthjs/openauth/client';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { authSubjects } from '../../auth-worker/subjects';

const ACCESS_COOKIE = 'avrxt_access';
const REFRESH_COOKIE = 'avrxt_refresh';

export type AuthUser = {
  id: string;
  email?: string;
  provider: string;
  admin: boolean;
  user_metadata: { full_name?: string; user_name?: string; avatar_url?: string };
};

let cachedClient: ReturnType<typeof createClient> | undefined;
let cachedIssuer = '';
let clientCreatedAt = 0;
export function getOpenAuthClient() {
  const issuer = process.env.OPENAUTH_ISSUER_URL || 'https://auth.avrxt.dev';
  // Discovery/JWKS are cached inside this client, not in createClient itself.
  // Refresh it periodically so signing-key rotation is picked up.
  if (!cachedClient || cachedIssuer !== issuer || Date.now() - clientCreatedAt >= 300_000) {
    cachedClient = createClient({ clientID: 'avrxt-web', issuer, fetch: (url, options) => fetch(url, {
      ...options, signal: options?.signal ?? AbortSignal.timeout(options?.method === 'POST' ? 15000 : 5000),
    }) });
    cachedIssuer = issuer;
    clientCreatedAt = Date.now();
  }
  return cachedClient;
}

export function getAuthCallbackUrl(requestUrl: string, next: string) {
  const request = new URL(requestUrl);
  const isLocal = request.hostname === 'localhost' || request.hostname === '127.0.0.1';
  const origin = isLocal
    ? request.origin
    : (process.env.AUTH_CALLBACK_ORIGIN || 'https://www.avrxt.dev');
  const callback = new URL('/auth/callback', origin);
  callback.searchParams.set('next', next);
  return callback;
}

export async function setAuthTokens(access: string, refresh: string) {
  const store = await cookies();
  const options = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: 2592000 };
  store.set(ACCESS_COOKIE, access, options);
  store.set(REFRESH_COOKIE, refresh, options);
}

export async function clearAuthTokens() {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  const store = await cookies();
  const access = store.get(ACCESS_COOKIE)?.value;
  if (!access) return null;
  const verified = await getOpenAuthClient().verify(authSubjects, access, { refresh: store.get(REFRESH_COOKIE)?.value });
  if (verified.err || verified.aud !== 'avrxt-web' || verified.subject.type !== 'user') return null;
  if (verified.tokens) {
    // Server Components cannot write cookies; the proxy persists refreshed tokens.
    try { await setAuthTokens(verified.tokens.access, verified.tokens.refresh); } catch { /* read-only render */ }
  }
  const value = verified.subject.properties;
  return {
    id: value.id, email: value.email, provider: value.provider, admin: value.admin,
    user_metadata: { full_name: value.name, user_name: value.name, avatar_url: value.avatar },
  };
});
