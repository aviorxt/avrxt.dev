import { NextRequest, NextResponse } from 'next/server';
import { getAuthCallbackUrl, getOpenAuthClient } from '@/lib/openauth';
import { safeReturnPath } from '@/lib/auth-redirect';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get('provider');
  const next = safeReturnPath(request.nextUrl.searchParams.get('next'));
  if (provider !== 'discord' && provider !== 'github') return NextResponse.redirect(new URL('/auth/login?error=unsupported_provider', request.url));
  const callback = getAuthCallbackUrl(request.url, next);
  // Start on the callback host so the transaction cookie survives the round trip.
  if (callback.origin !== request.nextUrl.origin) {
    return NextResponse.redirect(new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, callback.origin));
  }
  const { url, challenge } = await getOpenAuthClient().authorize(callback.toString(), 'code', { provider, pkce: true });
  const response = NextResponse.redirect(url);
  response.cookies.set('avrxt_oauth_transaction', JSON.stringify({ ...challenge, next }), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/auth', maxAge: 600,
  });
  return response;
}
