import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/me/admin',
                '/docs/admin',
                '/api/',
                '/auth/',
                '/private/',
            ],
        },
        sitemap: 'https://www.avrxt.dev/sitemap.xml',
        host: 'https://www.avrxt.dev',
    };
}
