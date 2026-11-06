import { MetadataRoute } from 'next';
import { tools } from '@/lib/tool-catalog';
import { absoluteSiteUrl } from '@/lib/site-config';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

type SitemapEntry = {
    route: string;
    priority: number;
    changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;
    lastModified?: string;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticPages: SitemapEntry[] = [
        { route: '', priority: 1, changeFrequency: 'weekly', lastModified: '2026-11-06' },
        { route: '/about', priority: 0.9, changeFrequency: 'monthly', lastModified: '2026-11-06' },
        { route: '/contact', priority: 0.8, changeFrequency: 'monthly' },
        { route: '/guestbook', priority: 0.65, changeFrequency: 'weekly' },
        { route: '/tools', priority: 0.8, changeFrequency: 'monthly' },
        { route: '/status', priority: 0.6, changeFrequency: 'daily' },
        { route: '/terminal', priority: 0.6, changeFrequency: 'monthly' },
        ...tools.map(({ slug }) => ({ route: `/tools/${slug}`, priority: 0.7, changeFrequency: 'monthly' as const })),
        { route: '/signature', priority: 0.65, changeFrequency: 'monthly' },
        { route: '/uses', priority: 0.6, changeFrequency: 'monthly' },
        { route: '/subscribe', priority: 0.5, changeFrequency: 'monthly' },
        { route: '/announcements', priority: 0.7, changeFrequency: 'monthly' },
        { route: '/announcements/identity-impersonation-notice', priority: 0.7, changeFrequency: 'monthly' },
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
        url: absoluteSiteUrl(route),
        ...(lastModified ? { lastModified } : {}),
        changeFrequency,
        priority,
    }));
}
