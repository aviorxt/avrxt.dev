import { NextRequest, NextResponse } from 'next/server';
import { createGuestbookAuthorization, setGuestbookTransaction, type GuestbookProvider } from '@/lib/guestbook-auth';
import { safeReturnPath } from '@/lib/auth-redirect';
import { isGuestbookEnabled } from '@/lib/guestbook-config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!await isGuestbookEnabled()) return NextResponse.redirect(new URL('/guestbook?error=disabled', request.url));
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
