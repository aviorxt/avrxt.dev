import { createAdminClient } from '@/utils/supabase/admin';
import { getMeConfigAction } from '@/app/actions/me';
import MeAdminClient from './MeAdminClient';
import AdminDashboardShell from '@/components/admin/AdminDashboardShell';
import { getDashboardViewer } from '@/lib/dashboard-viewer';

export default async function AdminPanel({ dashboardPath }: { dashboardPath: string }) {
  const supabase = createAdminClient();
  const config = await getMeConfigAction();
  const { data: spotifyToken } = await supabase.from('spotify_tokens').select('id').single();
  const viewer = await getDashboardViewer();

  return <AdminDashboardShell dashboardPath={dashboardPath} viewer={viewer}><MeAdminClient initialConfig={config} isSpotifyConnected={!!spotifyToken} /></AdminDashboardShell>;
}
