import { NextRequest, NextResponse } from 'next/server';
import { createGuestbookAuthorization, setGuestbookTransaction, type GuestbookProvider } from '@/lib/guestbook-auth';
import { safeReturnPath } from '@/lib/auth-redirect';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get('provider');
  if (provider !== 'discord' && provider !== 'github') return NextResponse.redirect(new URL('/guestbook?error=provider', request.url));
  try {
    const { url, transaction } = createGuestbookAuthorization(request.url, provider as GuestbookProvider, safeReturnPath('/guestbook'));
    await setGuestbookTransaction(transaction);
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.redirect(new URL('/guestbook?error=auth', request.url));
  }
}
