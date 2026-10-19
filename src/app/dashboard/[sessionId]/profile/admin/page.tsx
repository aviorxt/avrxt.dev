import { notFound } from 'next/navigation';
import { buildPageMetadata } from '@/lib/page-metadata';
import { protectAdminPage } from '@/lib/auth-checks';
import { matchesAdminDashboardId } from '@/lib/admin-dashboard';
import AdminPanel from '@/app/me/admin/AdminPanel';

export const dynamic = 'force-dynamic';
export const metadata = buildPageMetadata({
  title: 'Dashboard',
  description: 'Private AVRXT administration dashboard.',
  noIndex: true,
  path: '/dashboard',
});

export default async function DashboardAdminPage({ params }: { params: Promise<{ sessionId: string }> }) {
  await protectAdminPage();
  const { sessionId } = await params;
  if (!await matchesAdminDashboardId(sessionId)) notFound();
  return <AdminPanel dashboardPath={`/dashboard/${sessionId}/profile/admin`} />;
}
