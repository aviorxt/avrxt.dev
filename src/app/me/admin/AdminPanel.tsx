import { createAdminClient } from '@/utils/supabase/admin';
import { getMeConfigAction } from '@/app/actions/me';
import MeAdminClient from './MeAdminClient';
import AdminDashboardShell from '@/components/admin/AdminDashboardShell';

export default async function AdminPanel({ dashboardPath }: { dashboardPath: string }) {
  const supabase = createAdminClient();
  const config = await getMeConfigAction();
  const { data: spotifyToken } = await supabase.from('spotify_tokens').select('id').single();

  return <AdminDashboardShell dashboardPath={dashboardPath}><MeAdminClient initialConfig={config} isSpotifyConnected={!!spotifyToken} dashboardPath={dashboardPath} /></AdminDashboardShell>;
}
