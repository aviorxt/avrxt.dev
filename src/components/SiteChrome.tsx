'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StatusBadge from '@/components/StatusBadge';

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

function isMeRoute(pathname: string) {
    return pathname === '/me' || pathname.startsWith('/me/');
}

function isFooterHidden(pathname: string) {
    return FOOTER_HIDDEN_ROUTES.has(pathname) || isMeRoute(pathname);
}

function isNavHidden(pathname: string) {
    return NAV_HIDDEN_ROUTES.has(pathname) || isMeRoute(pathname);
}

export default function SiteChrome({ position }: { position: 'before' | 'after' }) {
    const pathname = usePathname();

    if (position === 'before') {
        if (isNavHidden(pathname)) return null;
        return (
            <>
                <div className="mesh-gradient" />
                <Navbar />
            </>
        );
    }

    if (isFooterHidden(pathname)) {
        // The public profile already places the badge inside its bespoke layout.
        if (pathname === '/me') return null;

        return (
            <aside
                aria-label="Website availability"
                className="relative z-20 mx-auto flex w-full max-w-7xl justify-center px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 sm:justify-end sm:px-6 lg:px-8"
            >
                <StatusBadge />
            </aside>
        );
    }
    return (
        <Footer />
    );
}
