'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

const Navbar = dynamic(() => import('@/components/Navbar'), { ssr: false });
const Footer = dynamic(() => import('@/components/Footer'), { ssr: false });
const StatusBadge = dynamic(() => import('@/components/StatusBadge'), { ssr: false });

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
    return pathname === '/me' || pathname.startsWith('/me/') || pathname.startsWith('/dashboard');
}

function isFooterHidden(pathname: string) {
    return FOOTER_HIDDEN_ROUTES.has(pathname) || isMeRoute(pathname) || pathname.startsWith('/auth/');
}

function isNavHidden(pathname: string) {
    return NAV_HIDDEN_ROUTES.has(pathname) || isMeRoute(pathname) || pathname === '/notes' || pathname.startsWith('/auth/');
}

export default function SiteChrome({ position }: { position: 'before' | 'after' }) {
    const pathname = usePathname();
    const deferHomeFooter = position === 'after' && pathname === '/';
    const [isHomeFooterReady, setIsHomeFooterReady] = useState(!deferHomeFooter);

    useEffect(() => {
        if (!deferHomeFooter) {
            setIsHomeFooterReady(true);
            return;
        }

        const reveal = () => setIsHomeFooterReady(true);
        const windowWithIdle = window as Window & {
            requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
            cancelIdleCallback?: (handle: number) => void;
        };
        const idleHandle = windowWithIdle.requestIdleCallback?.(reveal, { timeout: 1800 });
        const timeoutHandle = idleHandle === undefined ? window.setTimeout(reveal, 900) : undefined;

        return () => {
            if (idleHandle !== undefined) windowWithIdle.cancelIdleCallback?.(idleHandle);
            if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle);
        };
    }, [deferHomeFooter]);

    // Authentication is intentionally a self-contained surface. Rendering any
    // site chrome here creates overflowing menus on small screens and distracts
    // from the OAuth flow.
    if (pathname.startsWith('/auth/')) return null;

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
    if (deferHomeFooter && !isHomeFooterReady) return null;

    return <Footer />;
}
