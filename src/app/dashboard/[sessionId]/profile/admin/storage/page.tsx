import { notFound } from 'next/navigation';
import { protectAdminPage } from '@/lib/auth-checks';
import { matchesAdminDashboardId } from '@/lib/admin-dashboard';
import StorageClient from './StorageClient';
import AdminDashboardShell from '@/components/admin/AdminDashboardShell';
import { getDashboardViewer } from '@/lib/dashboard-viewer';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Storage | AVRXT Dashboard', robots: { index: false, follow: false } };

export default async function StoragePage({ params }: { params: Promise<{ sessionId: string }> }) {
  await protectAdminPage();
  const { sessionId } = await params;
  if (!await matchesAdminDashboardId(sessionId)) notFound();
  const dashboardPath = `/dashboard/${sessionId}/profile/admin`;
  const viewer = await getDashboardViewer();
  return <AdminDashboardShell dashboardPath={dashboardPath} viewer={viewer}><StorageClient dashboardPath={dashboardPath} /></AdminDashboardShell>;
}
