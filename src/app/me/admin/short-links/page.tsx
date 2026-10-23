import { protectAdminPage } from '@/lib/auth-checks';
import { getAdminDashboardPath } from '@/lib/admin-dashboard';
import { getDashboardViewer } from '@/lib/dashboard-viewer';
import { listShortLinksAction } from '@/app/actions/short-links';
import AdminDashboardShell from '@/components/admin/AdminDashboardShell';
import ShortLinksClient from './ShortLinksClient';

export const metadata = { title: 'Short links | avrxt Admin', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function ShortLinksPage({ dashboardPath: dashboardPathProp }: { dashboardPath?: string }) {
  await protectAdminPage();
  const dashboardPath = dashboardPathProp ?? await getAdminDashboardPath();
  const result = await listShortLinksAction();
  const viewer = await getDashboardViewer();
  return <AdminDashboardShell dashboardPath={dashboardPath} viewer={viewer}><main className="min-h-[calc(100svh-3rem)] bg-[#070707] px-4 py-6 text-zinc-100 sm:px-6 sm:py-8 lg:px-10 lg:py-10"><div className="mx-auto w-full max-w-7xl"><ShortLinksClient initialLinks={'links' in result ? result.links ?? [] : []} initialError={'error' in result ? result.error : undefined} /></div></main></AdminDashboardShell>;
}
