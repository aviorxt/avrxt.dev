import { getPublicStatusSnapshot } from '@/lib/status-source';

export const dynamic = 'force-dynamic';
export async function GET() {
  const snapshot = await getPublicStatusSnapshot();
  return Response.json({ status: snapshot.status, label: snapshot.label }, { headers: { 'Cache-Control': snapshot.available ? 'public, s-maxage=30, stale-while-revalidate=30' : 'no-store' } });
}
