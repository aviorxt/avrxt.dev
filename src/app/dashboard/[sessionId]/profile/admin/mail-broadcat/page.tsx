import { notFound } from 'next/navigation';
import { protectAdminPage } from '@/lib/auth-checks';
import { matchesAdminDashboardId } from '@/lib/admin-dashboard';
import MailBroadcastPage from '@/app/me/admin/mail-broadcat/page';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export default async function DashboardMailBroadcastPage({ params }: { params: Promise<{ sessionId: string }> }) {
  await protectAdminPage();
  const { sessionId } = await params;
  if (!await matchesAdminDashboardId(sessionId)) notFound();
  return <MailBroadcastPage dashboardPath={`/dashboard/${sessionId}/profile/admin`} />;
}
