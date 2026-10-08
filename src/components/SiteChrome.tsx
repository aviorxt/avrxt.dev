'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const NAV_HIDDEN_ROUTES = new Set([
    '/', '/me', '/me/admin', '/maintenance', '/link-error-404',
    '/400', '/401', '/403', '/404', '/408', '/429',
    '/500', '/502', '/503', '/504',
]);

const FOOTER_HIDDEN_ROUTES = new Set([
    '/me', '/me/admin', '/maintenance', '/link-error-404',
    '/400', '/401', '/403', '/404', '/408', '/429',
    '/500', '/502', '/503', '/504',
]);

export default function SiteChrome({ position }: { position: 'before' | 'after' }) {
    const pathname = usePathname();

    if (position === 'before') {
        if (NAV_HIDDEN_ROUTES.has(pathname)) return null;
        return (
            <>
                <div className="mesh-gradient" />
                <Navbar />
            </>
        );
    }

    if (FOOTER_HIDDEN_ROUTES.has(pathname)) return null;
    return (
        <Footer />
    );
}
