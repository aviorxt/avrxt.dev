import { NextRequest, NextResponse } from 'next/server';
import { getAuthCallbackUrl, getOpenAuthClient, setAuthTokens } from '@/lib/openauth';
import { safeReturnPath } from '@/lib/auth-redirect';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const fail = () => {
    const response = NextResponse.redirect(new URL('/auth/login?source=admin&error=oauth_callback_failed', request.url));
    response.cookies.set('avrxt_oauth_transaction', '', { path: '/auth', maxAge: 0 });
    return response;
  };
  let transaction: { state?: string; verifier?: string; next?: string };
  try { transaction = JSON.parse(request.cookies.get('avrxt_oauth_transaction')?.value || '{}'); }
  catch { return fail(); }
  const next = safeReturnPath(transaction.next);
  if (!code || typeof transaction.state !== 'string' || typeof transaction.verifier !== 'string' || !transaction.state || !transaction.verifier || transaction.state !== request.nextUrl.searchParams.get('state')
    || next !== safeReturnPath(request.nextUrl.searchParams.get('next'))) return fail();
  const callback = getAuthCallbackUrl(request.url, next);
  const exchanged = await getOpenAuthClient().exchange(code, callback.toString(), transaction.verifier);
  if (exchanged.err) {
    console.error('[OPENAUTH_CALLBACK]', exchanged.err);
    return fail();
  }
  await setAuthTokens(exchanged.tokens.access, exchanged.tokens.refresh);
  const response = NextResponse.redirect(new URL(next, request.url));
  response.cookies.set('avrxt_oauth_transaction', '', { path: '/auth', maxAge: 0 });
  return response;
}
