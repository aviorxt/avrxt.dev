import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth-checks';
import { createNotesExtensionToken, extensionIdFromRedirect } from '@/lib/notes-extension-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const redirectUri = request.nextUrl.searchParams.get('redirect_uri');
  const extensionId = redirectUri ? extensionIdFromRedirect(redirectUri) : null;
  if (!redirectUri || !extensionId) return new NextResponse('Extension is not configured for this AVRXT site.', { status: 403 });

  const auth = await verifyAdmin();
  if (!auth.authorized) {
    const login = new URL('/auth/login', request.url);
    login.searchParams.set('source', 'admin');
    login.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);
    login.searchParams.set('error', auth.error);
    return NextResponse.redirect(login);
  }

  const destination = new URL(redirectUri);
  destination.searchParams.set('token', createNotesExtensionToken(auth.user, extensionId));
  return NextResponse.redirect(destination);
}
