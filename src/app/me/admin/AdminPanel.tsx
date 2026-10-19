import { createAdminClient } from '@/utils/supabase/admin';
import { getMeConfigAction } from '@/app/actions/me';
import MeAdminClient from './MeAdminClient';

export default async function AdminPanel({ dashboardPath }: { dashboardPath: string }) {
  const supabase = createAdminClient();
  const config = await getMeConfigAction();
  const { data: spotifyToken } = await supabase.from('spotify_tokens').select('id').single();

  return <MeAdminClient initialConfig={config} isSpotifyConnected={!!spotifyToken} dashboardPath={dashboardPath} />;
}
