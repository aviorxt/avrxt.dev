'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, ChevronDown, FileText, Mail, Wrench } from 'lucide-react';
import Github from '@thesvg/react/github';
import Instagram from '@thesvg/react/instagram';
import { tools } from '@/lib/tool-catalog';
import StatusBadge from './StatusBadge';
import DmcaBadge from './DmcaBadge';
import { Tooltip } from './ui/Tooltip';

const pageGroups = [
    {
        title: 'Explore',
        links: [
            { label: 'Home', href: '/' },
            { label: 'About', href: '/about' },
            { label: 'Profile', href: '/me' },
            { label: 'Signature', href: '/signature' },
            { label: 'Uses', href: '/uses' },
            { label: 'Contact', href: '/contact' },
        ],
    },
    {
        title: 'Resources',
        links: [
            { label: 'Documentation', href: '/docs' },
            { label: 'Tools directory', href: '/tools' },
            { label: 'Terminal', href: '/terminal' },
            { label: 'Muzix chart', href: '/muzix/chart' },
            { label: 'Subscribe', href: '/subscribe' },
            { label: 'API documentation', href: '/system/api/doc' },
            { label: 'Website source', href: 'https://github.com/aviorxt/avrxt-core-web', external: true },
            { label: 'System status', href: '/status' },
        ],
    },
    {
        title: 'Policies',
        links: [
            { label: 'Privacy', href: '/legal/privacy' },
            { label: 'Terms', href: '/legal/terms' },
            { label: 'Refunds', href: '/legal/refund' },
            { label: 'Security', href: '/legal/security' },
            { label: 'Brand assets', href: '/legal/assets' },
            { label: 'Ownership', href: '/annon/ownership' },
            { label: 'Discord privacy', href: '/dc/privacy' },
            { label: 'Discord terms', href: '/dc/terms' },
        ],
    },
] as const;

export default function Footer() {
    const pathname = usePathname();
    const [year, setYear] = useState(2026);

    useEffect(() => {
        setYear(new Date().getFullYear());
    }, []);

    if (pathname.startsWith('/me')) return null;

    return (
        <footer className="v7-footer border-t border-cyan-300/15 bg-[#060606]/90 py-8 backdrop-blur-sm sm:py-16">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <div className="flex flex-col gap-5 border-b border-[#1F1F1F] pb-7 sm:gap-7 sm:pb-9 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <Link href="/" prefetch={false} className="font-outfit text-3xl font-semibold uppercase tracking-[-.055em] text-white">AVRXT<span className="text-[#666666]">.DEV</span></Link>
                        <p className="mt-3 max-w-md text-sm leading-6 text-[#858585]">Independent development, technical notes, practical tools, music signals, and digital systems built from India.</p>
                    </div>
                    <div className="footer-status-blend flex w-full justify-start sm:w-fit sm:justify-end"><StatusBadge /></div>
                </div>

                <FooterNavigation />

                <div className="flex flex-col gap-6 border-t border-[#1F1F1F] pt-7 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
                        <DmcaBadge />
                        <p className="font-mono text-[9px] uppercase leading-5 tracking-[.14em] text-[#858585]">
                            &copy; avrxt.dev 2024&ndash;{year}. All rights reserved.
                        </p>
                        <a
                            href="https://www.instagram.com/aviorxt/"
                            target="_blank"
                            rel="noreferrer"
                            aria-label="@aviorxt on Instagram"
                            className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[.08em] text-[#A3A3A3] transition-colors hover:text-white"
                        >
                            <span>with</span>
                            <span aria-hidden="true">🩶</span>
                            <span>@aviorxt</span>
                        </a>
                    </div>
                    <nav aria-label="Social links" className="flex items-center gap-2">
                        <Tooltip label="GitHub"><a href="https://github.com/aviorxt" target="_blank" rel="noreferrer" aria-label="aviorxt on GitHub" className="grid size-10 place-items-center border border-[#292929] text-[#858585] transition-colors hover:border-[#666666] hover:text-white"><Github variant="mono" width={15} height={15} aria-hidden="true" /></a></Tooltip>
                        <Tooltip label="Instagram"><a href="https://www.instagram.com/aviorxt/" target="_blank" rel="noreferrer" aria-label="@aviorxt on Instagram" className="grid size-10 place-items-center border border-[#292929] text-[#858585] transition-colors hover:border-[#666666] hover:text-white"><Instagram variant="mono" width={15} height={15} aria-hidden="true" /></a></Tooltip>
                        <Tooltip label="Email support"><a href="mailto:support@avrxt.dev" aria-label="Email avrxt.dev support" className="grid size-10 place-items-center border border-[#292929] text-[#858585] transition-colors hover:border-[#666666] hover:text-white"><Mail size={15} aria-hidden="true" /></a></Tooltip>
                    </nav>
                </div>
            </div>
        </footer>
    );
}

function FooterNavigation() {
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const menus = [
        ...pageGroups,
        { title: 'Tools', links: tools.map((tool) => ({ label: tool.title, href: `/tools/${tool.slug}` })) },
    ];

    return <nav aria-label="Footer navigation" className="relative z-10 flex flex-wrap gap-1.5 py-6 sm:gap-2 sm:py-10">
        {menus.map((menu) => {
            const isOpen = openMenu === menu.title;
            const Icon = menu.title === 'Tools' ? Wrench : menu.title === 'Policies' ? FileText : null;
            return <div key={menu.title} className="relative">
                <button type="button" aria-expanded={isOpen} aria-controls={`footer-menu-${menu.title.toLowerCase()}`} onClick={() => setOpenMenu(isOpen ? null : menu.title)} className="inline-flex min-h-9 items-center gap-1.5 border border-[#292929] bg-[#080808] px-3 font-mono text-[8px] uppercase tracking-[.12em] text-[#A3A3A3] transition-colors hover:border-[#686868] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:min-h-11 sm:gap-2 sm:px-4 sm:text-[9px] sm:tracking-[.16em]">
                    {Icon && <Icon size={12} />}{menu.title}<ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && <div id={`footer-menu-${menu.title.toLowerCase()}`} className="fixed inset-x-4 bottom-4 z-30 max-h-[60svh] overflow-y-auto border border-[#292929] bg-[#080808] p-1.5 shadow-2xl shadow-black/80 sm:absolute sm:inset-x-auto sm:bottom-[calc(100%+0.55rem)] sm:left-0 sm:z-20 sm:max-h-[min(50vh,20rem)] sm:w-[min(20rem,calc(100vw-2rem))] sm:p-2">
                    <p className="px-2.5 pb-1.5 pt-1 font-mono text-[7px] uppercase tracking-[.16em] text-[#666666] sm:px-3 sm:pb-2 sm:text-[8px] sm:tracking-[.2em]">{menu.title}</p>
                    <ul className="grid gap-0.5 sm:gap-1 sm:grid-cols-2">
                        {menu.links.map((link) => {
                            const external = 'external' in link && link.external;
                            return <li key={link.href}><Link href={link.href} prefetch={false} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} onClick={() => setOpenMenu(null)} className="group flex min-h-9 items-center justify-between gap-3 px-2.5 text-xs text-[#A3A3A3] transition-colors hover:bg-white/[.06] hover:text-white focus-visible:bg-white/[.06] focus-visible:outline-none sm:min-h-11 sm:px-3 sm:text-sm"><span>{link.label}</span>{external && <ArrowUpRight size={11} className="shrink-0 text-[#666666] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:size-3" />}</Link></li>;
                        })}
                    </ul>
                </div>}
            </div>;
        })}
    </nav>;
}
