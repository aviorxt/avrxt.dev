import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/me/admin',
                '/dashboard/',
                '/docs/admin',
                '/api/',
                '/auth/',
                '/private/',
                '/storage/',
                '/storage/share/',
                '/preferance/',
                '/delete-request',
                '/contact/confirm',
                '/preference/',
            ],
        },
        sitemap: 'https://www.avrxt.dev/sitemap.xml',
        host: 'https://www.avrxt.dev',
    };
}
