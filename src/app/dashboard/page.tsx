import { redirect } from 'next/navigation';
import { protectAdminPage } from '@/lib/auth-checks';
import { getAdminDashboardPath } from '@/lib/admin-dashboard';

export const dynamic = 'force-dynamic';

export default async function DashboardEntryPage() {
  await protectAdminPage();
  redirect(await getAdminDashboardPath());
}
