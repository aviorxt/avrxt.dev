import { cachedPublic } from '@/lib/public-cache';
import { createPublicClient } from '@/utils/supabase/public';
import type { DocArticle } from '@/lib/docs-config';
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

export async function getPublicDocuments(): Promise<DocArticle[]> {
  return cachedPublic('documents', { ttlSeconds: 300, tags: ['documents'] }, async () => {
    const { data, error } = await createPublicClient().from('documents').select('id,slug,title,description,content,category,color,published,author,tags,date,created_at,last_modified').eq('published', true).order('created_at', { ascending: false });
    if (error) throw new Error('Published documents lookup failed');
    return (data || []) as DocArticle[];
  });
}

export async function getPublicDocument(slug: string): Promise<DocArticle | null> {
  if (!slug || slug.length > 200) return null;
  return cachedPublic(`document:${slug}`, { ttlSeconds: 300, tags: ['documents'], cacheable: value => value !== null }, async () => {
    const { data, error } = await createPublicClient().from('documents').select('id,slug,title,description,content,category,color,published,author,tags,date,created_at,last_modified').eq('slug', slug).eq('published', true).maybeSingle();
    if (error) throw new Error('Published document lookup failed');
    return data as DocArticle | null;
  });
}
