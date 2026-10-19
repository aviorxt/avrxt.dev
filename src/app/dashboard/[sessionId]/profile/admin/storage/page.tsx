import { notFound } from 'next/navigation';
import { protectAdminPage } from '@/lib/auth-checks';
import { matchesAdminDashboardId } from '@/lib/admin-dashboard';
import StorageClient from './StorageClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Storage | AVRXT Dashboard', robots: { index: false, follow: false } };

export default async function StoragePage({ params }: { params: Promise<{ sessionId: string }> }) {
  await protectAdminPage();
  const { sessionId } = await params;
  if (!await matchesAdminDashboardId(sessionId)) notFound();
  return <StorageClient dashboardPath={`/dashboard/${sessionId}/profile/admin`} />;
}
