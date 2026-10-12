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
  catch (error) {
    // Only fixed internal categories reach logs/the authenticated scheduler.
    // Provider bodies, credentials and document contents must never be returned.
    const categories: Record<string, string> = {
      'Only Production reconciles the public index': 'preview_read_only',
      'Search indexing is not configured': 'index_configuration',
      'Search indexing lock is not configured': 'lock_configuration',
      'Search indexing is busy': 'index_busy',
      'Public search source lookup failed or exceeded its limit': 'public_source',
      'Search indexing task timed out': 'provider_task_pending',
      'Public search index exceeded its limit': 'index_limit',
    };
    const reason = error instanceof Error && Object.hasOwn(categories, error.message) ? categories[error.message]
      : error instanceof Error && /^Search indexing HTTP \d{3}$/.test(error.message) ? `provider_http_${error.message.slice(-3)}`
      : error instanceof Error && ['AbortError', 'TimeoutError'].includes(error.name) ? 'upstream_timeout' : 'unavailable';
    console.warn('Public search reconciliation failed.', { reason });
    return Response.json({ error: 'Search reconciliation unavailable', reason }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
