import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { protectAdminPage } from '@/lib/auth-checks';
import { getAdminDashboardPath } from '@/lib/admin-dashboard';
import { getRecentNewsletterBroadcastsAction } from '@/app/actions/mail-broadcast';
import BroadcastClient from './BroadcastClient';

export const metadata = {
    title: 'Mail Broadcast | avrxt Admin',
    description: 'Create and send newsletter broadcasts with Resend.',
    robots: { index: false, follow: false },
};
export const maxDuration = 300;

export default async function MailBroadcastPage() {
    await protectAdminPage();
    const dashboardPath = await getAdminDashboardPath();
    const recentResult = await getRecentNewsletterBroadcastsAction();
    const broadcasts = 'broadcasts' in recentResult ? recentResult.broadcasts ?? [] : [];

    return (
        <main className="min-h-screen bg-[#070707] px-4 py-6 text-zinc-100 sm:px-7 sm:py-9 lg:px-10">
            <div className="mx-auto max-w-[1500px]">
                <Link href={dashboardPath} className="mb-7 inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs text-zinc-400 transition hover:border-white/20 hover:text-white">
                    <ArrowLeft size={14} /> Admin dashboard
                </Link>
                <BroadcastClient initialBroadcasts={broadcasts} defaultFrom={process.env.RESEND_DEFAULT_FROM || 'avrxt Updates <news@avrxt.dev>'} />
            </div>
        </main>
    );
}
