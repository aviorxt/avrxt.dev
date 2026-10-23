import { NextRequest, NextResponse } from 'next/server';
import { createDiscordAuthorization, getDiscordCallbackUrl } from '@/lib/discord-auth';
import { safeReturnPath } from '@/lib/auth-redirect';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get('provider');
  const next = safeReturnPath(request.nextUrl.searchParams.get('next'));
  if (provider !== 'discord') return NextResponse.redirect(new URL('/auth/login?error=unsupported_provider', request.url));
  const callback = getDiscordCallbackUrl(request.url);
  // OAuth must begin on the same canonical host that receives its callback so
  // the browser-bound transaction cookie survives preview-to-production hops.
  if (callback.origin !== request.nextUrl.origin) return NextResponse.redirect(new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, callback.origin));
  try {
    const { url, transaction } = createDiscordAuthorization(request.url, next);
    const response = NextResponse.redirect(url);
    response.cookies.set('avrxt_oauth_transaction', JSON.stringify(transaction), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/auth', maxAge: 600,
    });
    return response;
  } catch {
    return NextResponse.redirect(new URL('/auth/login?source=admin&error=auth_configuration', request.url));
  }
}
