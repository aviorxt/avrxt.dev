import { protectAdminPage } from '@/lib/auth-checks';
import { getAdminDashboardPath } from '@/lib/admin-dashboard';
import { getRecentNewsletterBroadcastsAction } from '@/app/actions/mail-broadcast';
import BroadcastClient from './BroadcastClient';
import AdminDashboardShell from '@/components/admin/AdminDashboardShell';

export const metadata = {
    title: 'Mail Broadcast | avrxt Admin',
    description: 'Create and send newsletter broadcasts with Resend.',
    robots: { index: false, follow: false },
};
export const maxDuration = 300;

export default async function MailBroadcastPage({ dashboardPath: dashboardPathProp }: { dashboardPath?: string }) {
    await protectAdminPage();
    const dashboardPath = dashboardPathProp ?? await getAdminDashboardPath();
    const recentResult = await getRecentNewsletterBroadcastsAction();
    const broadcasts = 'broadcasts' in recentResult ? recentResult.broadcasts ?? [] : [];

    return (
        <AdminDashboardShell dashboardPath={dashboardPath}><main className="min-h-screen bg-[#070707] px-4 py-6 text-zinc-100 sm:px-7 sm:py-9 lg:px-10">
            <div className="mx-auto max-w-[1500px]">
                <BroadcastClient initialBroadcasts={broadcasts} defaultFrom={process.env.RESEND_DEFAULT_FROM || 'avrxt Updates <news@avrxt.dev>'} />
            </div>
        </main></AdminDashboardShell>
    );
}
