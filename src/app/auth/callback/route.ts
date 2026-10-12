import { NextRequest, NextResponse } from 'next/server';
import { getAuthCallbackUrl, getOpenAuthClient, setAuthTokens } from '@/lib/openauth';
import { safeReturnPath } from '@/lib/auth-redirect';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const fail = (error = 'oauth_callback_failed') => {
    const response = NextResponse.redirect(new URL(`/auth/login?source=admin&error=${error}`, request.url));
    response.cookies.set('avrxt_oauth_transaction', '', { path: '/auth', maxAge: 0 });
    return response;
  };
  let transaction: { state?: string; verifier?: string; next?: string };
  try { transaction = JSON.parse(request.cookies.get('avrxt_oauth_transaction')?.value || '{}'); }
  catch { return fail(); }
  const next = safeReturnPath(transaction.next);
  if (!code || typeof transaction.state !== 'string' || typeof transaction.verifier !== 'string' || !transaction.state || !transaction.verifier || transaction.state !== request.nextUrl.searchParams.get('state')
    || next !== safeReturnPath(request.nextUrl.searchParams.get('next'))) return fail();
  try {
    const callback = getAuthCallbackUrl(request.url, next);
    const exchanged = await getOpenAuthClient().exchange(code, callback.toString(), transaction.verifier);
    if (exchanged.err) {
      console.warn('[OPENAUTH_CALLBACK] Authorization code rejected; start a new login.');
      return fail();
    }
    if (!exchanged.tokens?.access || !exchanged.tokens?.refresh) return fail();
    await setAuthTokens(exchanged.tokens.access, exchanged.tokens.refresh);
    const response = NextResponse.redirect(new URL(next, request.url));
    response.cookies.set('avrxt_oauth_transaction', '', { path: '/auth', maxAge: 0 });
    return response;
  } catch (error) {
    // Never log the callback URL, code, state, verifier, or token response.
    console.warn('[OPENAUTH_CALLBACK] Sign-in service failed', { kind: error instanceof Error ? error.name : 'unknown' });
    return fail('oauth_service_unavailable');
  }
}
