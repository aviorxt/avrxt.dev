import { NextRequest, NextResponse } from 'next/server';
import { clearGuestbookTransaction, exchangeGuestbookCode, getGuestbookTransaction, setGuestbookSession, type GuestbookProvider } from '@/lib/guestbook-auth';
import { safeReturnPath } from '@/lib/auth-redirect';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const transaction = await getGuestbookTransaction();
  const fail = async () => { await clearGuestbookTransaction(); return NextResponse.redirect(new URL('/guestbook?error=auth', request.url)); };
  if (!code || (transaction.provider !== 'discord' && transaction.provider !== 'github') || typeof transaction.state !== 'string' || typeof transaction.verifier !== 'string' || transaction.state !== request.nextUrl.searchParams.get('state')) return fail();
  try {
    const user = await exchangeGuestbookCode(code, transaction as { provider: GuestbookProvider; state: string; verifier: string; next: string }, request.url);
    await setGuestbookSession(user);
    await clearGuestbookTransaction();
    return NextResponse.redirect(new URL(safeReturnPath(transaction.next), request.url));
  } catch {
    return fail();
  }
}
