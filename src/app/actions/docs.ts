'use server';

import { getPublicDocuments, getPublicDocument } from '@/lib/public-data';
import { invalidatePublicCache } from '@/lib/public-cache';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { syncSearchDocument } from '@/lib/search-index';
import { DocArticle } from '@/lib/docs-config';
import { verifyAdmin } from '@/lib/auth-checks';
import { createAdminClient } from '@/utils/supabase/admin';

// Fetch all docs (Admin view - sees drafts too)
export async function getAdminDocs() {
    const { authorized } = await verifyAdmin();
    if (!authorized) return [];

    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching docs:', error);
        return [];
    }

    return data as DocArticle[];
}

// Fetch published docs (Public view)
export async function getPublishedDocs() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('Supabase is not configured, returning an empty public docs list.');
        return [];
    }

    try { return await getPublicDocuments(); }
    catch { return []; }
}

export async function getDocBySlug(slug: string) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return null;
    }

    try { return await getPublicDocument(slug); }
    catch { return null; }
}

export async function createDocAction(doc: Partial<DocArticle>) {
    const { authorized, error: authError } = await verifyAdmin();
    if (!authorized) {
        return { error: `Unauthorized: ${authError}` };
    }

    const supabase = createAdminClient();

    // Remove ID if present to let Supabase generate UUID
    const { id, ...docData } = doc;

    const { data, error } = await supabase
        .from('documents')
        .insert([{
            ...docData,
            created_at: new Date().toISOString(),
            last_modified: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) {
        return { error: error.message };
    }

    after(() => syncSearchDocument(data.id));
    const invalidated = await invalidatePublicCache('documents');
    revalidatePath('/docs');
    revalidatePath('/docs/[slug]', 'page');
    revalidatePath('/sitemap.xml');
    revalidatePath('/docs/admin');
    return { data, ...(!invalidated ? { warning: 'Saved, but Redis invalidation failed. Public content may take up to five minutes to refresh.' } : {}) };
}

export async function updateDocAction(id: string, updates: Partial<DocArticle>) {
    const { authorized, error: authError } = await verifyAdmin();
    if (!authorized) {
        return { error: `Unauthorized: ${authError}` };
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from('documents')
        .update({
            ...updates,
            last_modified: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return { error: error.message };
    }

    after(() => syncSearchDocument(data.id));
    const invalidated = await invalidatePublicCache('documents');
    revalidatePath('/docs');
    revalidatePath('/docs/[slug]', 'page');
    revalidatePath('/sitemap.xml');
    revalidatePath('/docs/admin');
    return { data, ...(!invalidated ? { warning: 'Saved, but Redis invalidation failed. Public content may take up to five minutes to refresh.' } : {}) };
}

export async function deleteDocAction(id: string) {
    const { authorized, error: authError } = await verifyAdmin();
    if (!authorized) {
        return { error: `Unauthorized: ${authError}` };
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from('documents').delete().eq('id', id);

    if (error) {
        return { error: error.message };
    }

    after(() => syncSearchDocument(id));
    const invalidated = await invalidatePublicCache('documents');
    revalidatePath('/docs');
    revalidatePath('/docs/[slug]', 'page');
    revalidatePath('/sitemap.xml');
    revalidatePath('/docs/admin');
    return { success: true, ...(!invalidated ? { warning: 'Deleted, but Redis invalidation failed. Public content may take up to five minutes to refresh.' } : {}) };
}
