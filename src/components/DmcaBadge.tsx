'use client';

import { usePathname } from 'next/navigation';

const badgeId = '92141cbb-32c0-4152-b778-87fed6ad3001';
const publicContentPages = new Set(['/', '/about', '/signature', '/legal/assets', '/annon/ownership']);

export default function DmcaBadge() {
    const pathname = usePathname();
    if (!publicContentPages.has(pathname)) return null;

    // Supply the public canonical page directly, rather than exposing the current
    // browser URL (which can contain private query parameters) to the helper script.
    const publicPage = `https://www.avrxt.dev${pathname === '/' ? '/' : pathname}`;
    const certificate = `https://www.dmca.com/Protection/Status.aspx?ID=${badgeId}&refurl=${encodeURIComponent(publicPage)}`;

    return (
        <a href={certificate} title="DMCA.com Protection Status" className="dmca-badge inline-flex" target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">
            {/* Keep the provider's original image URL and badge class for verification. */}
            <img src={`https://images.dmca.com/Badges/dmca_protected_sml_120n.png?ID=${badgeId}`} alt="DMCA.com Protection Status" width={120} height={24} loading="lazy" referrerPolicy="no-referrer" />
        </a>
    );
}
