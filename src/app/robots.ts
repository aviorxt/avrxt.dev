import { MetadataRoute } from 'next';
import { absoluteSiteUrl, SITE_URL } from '@/lib/site-config';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: ['/', '/api/og'],
            disallow: [
                '/me/admin',
                '/dashboard/',
                '/docs/admin',
                '/api/',
                '/auth/',
                '/notes/',
                '/private/',
                '/storage/',
                '/storage/share/',
                '/preferance/',
                '/delete-request',
                '/contact/confirm',
                '/preference/',
            ],
        },
        sitemap: absoluteSiteUrl('/sitemap.xml'),
        host: SITE_URL,
    };
}
