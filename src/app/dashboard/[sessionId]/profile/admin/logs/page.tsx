import { notFound } from 'next/navigation';
import { protectAdminPage } from '@/lib/auth-checks';
import { matchesAdminDashboardId } from '@/lib/admin-dashboard';
import LogsPage from '@/app/me/admin/logs/page';

export const dynamic = 'force-dynamic';

export default async function DashboardLogsPage({ params }: { params: Promise<{ sessionId: string }> }) {
  await protectAdminPage();
  const { sessionId } = await params;
  if (!await matchesAdminDashboardId(sessionId)) notFound();
  return <LogsPage dashboardPath={`/dashboard/${sessionId}/profile/admin`} />;
}
