import { MetadataRoute } from 'next';
import { tools } from '@/lib/tool-catalog';

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
        const response = await fetch(
            `${supabaseUrl}/rest/v1/documents?published=eq.true&select=slug,last_modified,created_at&order=created_at.desc`,
            {
                headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
                next: { revalidate: 3600 },
            },
        );
        if (!response.ok) return [];

        const documents = await response.json() as Array<{
            slug?: string;
            last_modified?: string;
            created_at?: string;
        }>;

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
        ...tools.map(({ slug }) => ({ route: `/tools/${slug}`, priority: 0.7, changeFrequency: 'monthly' as const })),
        { route: '/gallery', priority: 0.7, changeFrequency: 'monthly' },
        { route: '/docs', priority: 0.7, changeFrequency: 'weekly' },
        ...documentEntries,
        { route: '/uses', priority: 0.6, changeFrequency: 'monthly' },
        { route: '/subscribe', priority: 0.5, changeFrequency: 'monthly' },
        { route: '/system/api/doc', priority: 0.5, changeFrequency: 'monthly' },
        { route: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
        { route: '/terms', priority: 0.3, changeFrequency: 'yearly' },
        { route: '/dc/privacy', priority: 0.3, changeFrequency: 'yearly' },
        { route: '/dc/terms', priority: 0.3, changeFrequency: 'yearly' },
        { route: '/refund', priority: 0.3, changeFrequency: 'yearly' },
        { route: '/security', priority: 0.3, changeFrequency: 'yearly' },
    ];

    return staticPages.map(({ route, priority, changeFrequency, lastModified }) => ({
        url: `${SITE_URL}${route}`,
        ...(lastModified ? { lastModified } : {}),
        changeFrequency,
        priority,
    }));
}
