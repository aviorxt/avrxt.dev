import { getPublicStatusSnapshot } from '@/lib/status-source';

export const dynamic = 'force-dynamic';
export async function GET() {
  const snapshot = await getPublicStatusSnapshot();
  return Response.json(snapshot, { headers: { 'Cache-Control': snapshot.available ? 'public, s-maxage=60, stale-while-revalidate=300' : 'no-store' } });
}
