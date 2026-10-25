'use server';

import { getPublicDocuments, getPublicDocument } from '@/lib/public-data';
import { invalidatePublicCache } from '@/lib/public-cache';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { syncSearchDocument } from '@/lib/search-index';
import { DocArticle } from '@/lib/docs-config';
import { verifyAdmin } from '@/lib/auth-checks';
import { createAdminClient } from '@/utils/supabase/admin';

const DOC_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DOC_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DOC_COLORS = new Set<DocArticle['color']>(['blue', 'cyan', 'purple', 'green', 'orange', 'pink']);

function text(value: unknown, max: number) {
    return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function cleanDoc(input: Partial<DocArticle>) {
    const slug = text(input.slug, 120).toLowerCase();
    const title = text(input.title, 180);
    const content = typeof input.content === 'string' ? input.content.slice(0, 200_000) : '';
    if (!DOC_SLUG.test(slug) || !title || !content) throw new Error('A lowercase URL slug, title, and Markdown content are required.');
    const tags = Array.isArray(input.tags)
        ? [...new Set(input.tags.filter((tag): tag is string => typeof tag === 'string').map((tag) => text(tag, 40).toLowerCase()).filter(Boolean))].slice(0, 20)
        : [];
    return {
        slug, title, content,
        category: text(input.category, 80) || 'General',
        description: text(input.description, 500),
        color: DOC_COLORS.has(input.color as DocArticle['color']) ? input.color : 'cyan' as const,
        published: input.published === true,
        author: text(input.author, 80) || undefined,
        tags,
    };
}

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
        console.error('[DOCS_ADMIN_LIST_FAILED]');
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
    const { authorized } = await verifyAdmin();
    if (!authorized) {
        return { error: 'Unauthorized.' };
    }

    const supabase = createAdminClient();

    let docData;
    try { docData = cleanDoc(doc); }
    catch (error) { return { error: error instanceof Error ? error.message : 'Invalid document.' }; }

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
        console.error('[DOC_CREATE_FAILED]');
        return { error: 'Could not save this document. Please check the fields and try again.' };
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
    const { authorized } = await verifyAdmin();
    if (!authorized) {
        return { error: 'Unauthorized.' };
    }

    if (!DOC_ID.test(id)) return { error: 'Invalid document.' };
    let docData;
    try { docData = cleanDoc(updates); }
    catch (error) { return { error: error instanceof Error ? error.message : 'Invalid document.' }; }
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from('documents')
        .update({
            ...docData,
            last_modified: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('[DOC_UPDATE_FAILED]');
        return { error: 'Could not update this document. Please check the fields and try again.' };
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
    const { authorized } = await verifyAdmin();
    if (!authorized) {
        return { error: 'Unauthorized.' };
    }

    if (!DOC_ID.test(id)) return { error: 'Invalid document.' };
    const supabase = createAdminClient();
    const { error } = await supabase.from('documents').delete().eq('id', id);

    if (error) {
        console.error('[DOC_DELETE_FAILED]');
        return { error: 'Could not delete this document. Please try again.' };
    }

    after(() => syncSearchDocument(id));
    const invalidated = await invalidatePublicCache('documents');
    revalidatePath('/docs');
    revalidatePath('/docs/[slug]', 'page');
    revalidatePath('/sitemap.xml');
    revalidatePath('/docs/admin');
    return { success: true, ...(!invalidated ? { warning: 'Deleted, but Redis invalidation failed. Public content may take up to five minutes to refresh.' } : {}) };
}
