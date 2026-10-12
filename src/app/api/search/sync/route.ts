import { timingSafeEqual } from 'node:crypto';
import { syncPublicSearchIndex } from '@/lib/search-index';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const supplied = request.headers.get('authorization') || '';
  const expected = `Bearer ${secret || ''}`;
  if (!secret || secret.length < 32 || Buffer.byteLength(supplied) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  }
  try { return Response.json(await syncPublicSearchIndex(), { headers: { 'Cache-Control': 'no-store' } }); }
  catch { console.warn('Public search reconciliation failed.'); return Response.json({ error: 'Search reconciliation unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
}
