import { notFound } from 'next/navigation';
import { protectAdminPage } from '@/lib/auth-checks';
import { matchesAdminDashboardId } from '@/lib/admin-dashboard';
import ShortLinksPage from '@/app/me/admin/short-links/page';

export const dynamic = 'force-dynamic';

export default async function DashboardShortLinksPage({ params }: { params: Promise<{ sessionId: string }> }) {
  await protectAdminPage();
  const { sessionId } = await params;
  if (!await matchesAdminDashboardId(sessionId)) notFound();
  return <ShortLinksPage dashboardPath={`/dashboard/${sessionId}/profile/admin`} />;
}
