import { NextResponse } from 'next/server';
import { publicStorageLink } from '@/lib/s3-storage';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const { url } = await publicStorageLink(token);
    return NextResponse.redirect(url, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return new NextResponse('This storage share link is unavailable or expired.', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }
}
