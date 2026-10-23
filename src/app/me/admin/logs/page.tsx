import { protectAdminPage } from '@/lib/auth-checks';
import { getAdminDashboardPath } from '@/lib/admin-dashboard';
import { getDashboardViewer } from '@/lib/dashboard-viewer';
import { listAuditLogs } from '@/lib/audit-logs';
import AdminDashboardShell from '@/components/admin/AdminDashboardShell';
import LogsClient from './LogsClient';

export const metadata = { title: 'Audit logs | avrxt Admin', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function LogsPage({ dashboardPath: dashboardPathProp }: { dashboardPath?: string }) {
  await protectAdminPage();
  const [dashboardPath, viewer, initial] = await Promise.all([dashboardPathProp ?? getAdminDashboardPath(), getDashboardViewer(), listAuditLogs()]);
  return <AdminDashboardShell dashboardPath={dashboardPath} viewer={viewer}><main className="min-h-[calc(100svh-3rem)] bg-[#070707] px-4 py-6 text-zinc-100 sm:px-6 sm:py-8 lg:px-10 lg:py-10"><div className="mx-auto w-full max-w-7xl"><LogsClient initial={initial} /></div></main></AdminDashboardShell>;
}
