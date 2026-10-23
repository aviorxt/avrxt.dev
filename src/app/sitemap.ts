import { MetadataRoute } from 'next';
import { tools } from '@/lib/tool-catalog';
import { getPublicDocuments } from '@/lib/public-data';

const SITE_URL = 'https://www.avrxt.dev';

type SitemapEntry = {
    route: string;
    priority: number;
    changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;
    lastModified?: string;
};

async function getPublishedDocumentEntries(): Promise<SitemapEntry[]> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !anonKey) return [];

    try {
        const documents = await getPublicDocuments();

        return documents
            .filter((document) => typeof document.slug === 'string' && document.slug.length > 0)
            .map((document) => ({
                route: `/docs/${encodeURIComponent(document.slug!)}`,
                priority: 0.65,
                changeFrequency: 'monthly' as const,
                lastModified: document.last_modified || document.created_at,
            }));
    } catch {
        return [];
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const documentEntries = await getPublishedDocumentEntries();
    const staticPages: SitemapEntry[] = [
        { route: '', priority: 1, changeFrequency: 'weekly' },
        { route: '/about', priority: 0.9, changeFrequency: 'monthly' },
        { route: '/me', priority: 0.8, changeFrequency: 'monthly' },
        { route: '/contact', priority: 0.8, changeFrequency: 'monthly' },
        { route: '/tools', priority: 0.8, changeFrequency: 'monthly' },
        { route: '/status', priority: 0.6, changeFrequency: 'daily' },
        { route: '/terminal', priority: 0.6, changeFrequency: 'monthly' },
        ...tools.map(({ slug }) => ({ route: `/tools/${slug}`, priority: 0.7, changeFrequency: 'monthly' as const })),
        { route: '/signature', priority: 0.65, changeFrequency: 'monthly' },
        { route: '/docs', priority: 0.7, changeFrequency: 'weekly' },
        ...documentEntries,
        { route: '/uses', priority: 0.6, changeFrequency: 'monthly' },
        { route: '/muzix/chart', priority: 0.65, changeFrequency: 'daily' },
        { route: '/subscribe', priority: 0.5, changeFrequency: 'monthly' },
        { route: '/announcement', priority: 0.7, changeFrequency: 'monthly' },
        { route: '/system/api/doc', priority: 0.5, changeFrequency: 'monthly' },
        { route: '/legal/privacy', priority: 0.3, changeFrequency: 'yearly' },
        { route: '/legal/terms', priority: 0.3, changeFrequency: 'yearly' },
        { route: '/dc/privacy', priority: 0.3, changeFrequency: 'yearly' },
        { route: '/dc/terms', priority: 0.3, changeFrequency: 'yearly' },
        { route: '/legal/refund', priority: 0.3, changeFrequency: 'yearly' },
        { route: '/legal/security', priority: 0.3, changeFrequency: 'yearly' },
        { route: '/legal/assets', priority: 0.3, changeFrequency: 'yearly' },
        { route: '/annon/ownership', priority: 0.3, changeFrequency: 'yearly' },
    ];

    return staticPages.map(({ route, priority, changeFrequency, lastModified }) => ({
        url: `${SITE_URL}${route}`,
        ...(lastModified ? { lastModified } : {}),
        changeFrequency,
        priority,
    }));
}
