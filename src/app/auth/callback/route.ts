import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const destination = new URL('/auth/o1/dc/callback', request.url);
  destination.search = request.nextUrl.search;
  return NextResponse.redirect(destination);
}
