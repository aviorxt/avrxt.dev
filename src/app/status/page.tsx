import { buildPageMetadata } from '@/lib/page-metadata';
import { getPublicStatusSnapshot } from '@/lib/status-source';
import StatusClient from './StatusClient';
import MinimalErrorPage from '@/components/MinimalErrorPage';
import { isStatusPageEnabled } from '@/lib/public-feature-config';

export const dynamic = 'force-dynamic';
export const metadata = buildPageMetadata({ title: 'System Status', path: '/status', description: 'Live AVRXT service status, measured uptime, public incidents, maintenance windows, and daily monitoring history from Better Stack.', keywords: ['avrxt status', 'uptime', 'incidents', 'maintenance', 'service monitoring'] });
export default async function StatusPage() {
  if (!await isStatusPageEnabled()) return <MinimalErrorPage code="OFF" title="Status on external channel" message="The AVRXT status dashboard is currently unavailable here. Live service information remains available from the independent Better Stack status page." primaryHref="https://status.avrxt.dev" primaryLabel="Open status.avrxt.dev" secondaryHref="/" secondaryLabel="Return home" />;
  return <StatusClient initial={await getPublicStatusSnapshot()} />;
}
