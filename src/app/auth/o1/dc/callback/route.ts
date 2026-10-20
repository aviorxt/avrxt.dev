import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const destination = new URL('/auth/discord/callback', request.url);
  destination.search = request.nextUrl.search;
  return NextResponse.redirect(destination);
}
