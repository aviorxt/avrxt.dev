import { buildPageMetadata } from '@/lib/page-metadata';
import { getPublicStatusSnapshot } from '@/lib/status-source';
import StatusClient from './StatusClient';

export const dynamic = 'force-dynamic';
export const metadata = buildPageMetadata({ title: 'System Status', path: '/status', description: 'Live AVRXT service status, measured uptime, public incidents, maintenance windows, and daily monitoring history from Better Stack.', keywords: ['avrxt status', 'uptime', 'incidents', 'maintenance', 'service monitoring'] });
export default async function StatusPage() {
  return <StatusClient initial={await getPublicStatusSnapshot()} />;
}
