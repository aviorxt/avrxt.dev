import { cachedPublic } from '@/lib/public-cache';
import { createPublicClient } from '@/utils/supabase/public';
import type { MeConfig } from '@/lib/me-config';

export async function getPublicProfileRecord(): Promise<MeConfig | null> {
  return cachedPublic('profile', { ttlSeconds: 120, tags: ['profile'] }, async () => {
    const { data, error } = await createPublicClient().from('me_config').select('data').eq('key', 'main_config').maybeSingle();
    if (error) throw new Error('Public profile lookup failed');
    if (data && (!data.data?.profile || !data.data?.music)) throw new Error('Invalid public profile');
    return (data?.data as MeConfig) || null;
  });
}

export async function getPublicMaintenance(): Promise<boolean> {
  return cachedPublic('maintenance', { ttlSeconds: 10, tags: ['profile'] }, async () => {
    const { data, error } = await createPublicClient().from('me_config').select('data').eq('key', 'main_config').maybeSingle();
    if (error) throw new Error('Maintenance lookup failed');
    return data?.data?.site?.maintenanceEnabled === true;
  });
}
