'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    // Hide global navigation and footer on /me routes (including admin)
    const isMePage = pathname?.startsWith('/me') || pathname?.startsWith('/dashboard');

    if (isMePage) {
        return <>{children}</>;
    }

    return (
        <>
            <Navbar />
            {children}
            <Footer />
        </>
    );
}
