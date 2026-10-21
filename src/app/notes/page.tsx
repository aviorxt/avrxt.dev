import type { Metadata } from 'next';
import { protectAdminPage } from '@/lib/auth-checks';
import { getAdminDashboardPath } from '@/lib/admin-dashboard';
import { getDashboardViewer } from '@/lib/dashboard-viewer';
import { listNotes } from '@/lib/notes';
import AdminDashboardShell from '@/components/admin/AdminDashboardShell';
import NotesClient from './NotesClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Notes | avrxt Admin', robots: { index: false, follow: false } };

export default async function NotesPage() {
  const user = await protectAdminPage();
  const [dashboardPath, viewer, notes] = await Promise.all([getAdminDashboardPath(), getDashboardViewer(), listNotes(user.id)]);
  return <AdminDashboardShell dashboardPath={dashboardPath} viewer={viewer} showToolbar={false}><NotesClient initialNotes={notes} /></AdminDashboardShell>;
}
