import { NextRequest, NextResponse } from 'next/server';
import { clearGuestbookSession } from '@/lib/guestbook-auth';

export const dynamic = 'force-dynamic';

function hasTrustedOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  return !origin || origin === request.nextUrl.origin || origin === 'https://www.avrxt.dev' || origin === 'https://avrxt.dev';
}

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return NextResponse.json({ error: 'CROSS_SITE_REQUEST_REJECTED' }, { status: 403 });
  await clearGuestbookSession();
  return NextResponse.json({ success: true });
}
