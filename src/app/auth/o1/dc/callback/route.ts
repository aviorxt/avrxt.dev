import { NextRequest, NextResponse } from 'next/server';
import { exchangeDiscordCode, setAuthSession } from '@/lib/discord-auth';
import { safeReturnPath } from '@/lib/auth-redirect';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const fail = (error = 'oauth_callback_failed') => {
    const response = NextResponse.redirect(new URL(`/auth/login?source=admin&error=${error}`, request.url));
    response.cookies.set('avrxt_oauth_transaction', '', { path: '/auth', maxAge: 0 });
    return response;
  };
  let transaction: { state?: string; verifier?: string; next?: string };
  try { transaction = JSON.parse(request.cookies.get('avrxt_oauth_transaction')?.value || '{}'); }
  catch { return fail(); }
  const code = request.nextUrl.searchParams.get('code');
  if (!code || !transaction.state || !transaction.verifier || transaction.state !== request.nextUrl.searchParams.get('state')) return fail();
  try {
    const user = await exchangeDiscordCode(code, transaction.verifier, request.url);
    await setAuthSession(user);
    const response = NextResponse.redirect(new URL(safeReturnPath(transaction.next), request.url));
    response.cookies.set('avrxt_oauth_transaction', '', { path: '/auth', maxAge: 0 });
    return response;
  } catch (error) {
    console.warn('[DISCORD_OAUTH_CALLBACK] Sign-in service failed', { kind: error instanceof Error ? error.name : 'unknown' });
    return fail('oauth_service_unavailable');
  }
}
