import { redirect } from 'next/navigation';
import { protectAdminPage } from '@/lib/auth-checks';
import { getAdminDashboardPath } from '@/lib/admin-dashboard';

export default async function MeAdminPage() {
    await protectAdminPage();
    redirect(await getAdminDashboardPath());
}
