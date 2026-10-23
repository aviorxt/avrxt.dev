import { getPublicStatusSnapshot } from '@/lib/status-source';
import { isStatusBadgeEnabled, isStatusPageEnabled } from '@/lib/public-feature-config';

export const dynamic = 'force-dynamic';
export async function GET() {
  if (!await isStatusPageEnabled()) return Response.json({ error: 'STATUS_DISABLED', externalStatusUrl: 'https://status.avrxt.dev' }, { status: 404, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
  const snapshot = await getPublicStatusSnapshot();
  return Response.json({ status: snapshot.status, label: snapshot.label, badgeEnabled: await isStatusBadgeEnabled() }, { headers: { 'Cache-Control': snapshot.available ? 'public, s-maxage=60, stale-while-revalidate=300' : 'no-store' } });
}
