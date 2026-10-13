'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Github, Instagram, Mail } from 'lucide-react';
import { tools } from '@/lib/tool-catalog';
import StatusBadge from './StatusBadge';
import DmcaBadge from './DmcaBadge';

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
        <footer className="v7-footer border-t border-cyan-300/15 bg-[#060606]/90 py-12 backdrop-blur-sm sm:py-16">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <div className="flex flex-col gap-7 border-b border-[#1F1F1F] pb-9 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <Link href="/" className="font-outfit text-3xl font-semibold uppercase tracking-[-.055em] text-white">AVRXT<span className="text-[#666666]">.DEV</span></Link>
                        <p className="mt-3 max-w-md text-sm leading-6 text-[#858585]">Independent development, technical notes, practical tools, music signals, and digital systems built from India.</p>
                    </div>
                    <div className="footer-status-blend flex w-full max-w-[18rem] justify-start sm:w-fit sm:justify-end"><StatusBadge /></div>
                </div>

                <div className="grid gap-10 py-10 sm:grid-cols-2 lg:grid-cols-[.8fr_.9fr_1.4fr_1fr] lg:gap-8">
                    {pageGroups.slice(0, 2).map((group) => (
                        <nav key={group.title} aria-label={`${group.title} pages`}>
                            <h2 className="font-mono text-[8px] uppercase tracking-[.24em] text-[#666666]">{group.title}</h2>
                            <ul className="mt-5 space-y-3">
                                {group.links.map((link) => (
                                    <li key={link.href}>
                                        <Link href={link.href} target={'external' in link && link.external ? '_blank' : undefined} rel={'external' in link && link.external ? 'noreferrer' : undefined} className="group inline-flex items-center gap-2 text-sm text-[#A3A3A3] transition-colors hover:text-white">
                                            {link.label}{'external' in link && link.external && <ArrowUpRight size={11} className="text-[#484848] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    ))}

                    <nav aria-label="Tool pages">
                        <h2 className="font-mono text-[8px] uppercase tracking-[.24em] text-[#666666]">Tools</h2>
                        <ul className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3">
                            {tools.map((tool) => (
                                <li key={tool.slug}>
                                    <Link href={`/tools/${tool.slug}`} className="text-sm text-[#A3A3A3] transition-colors hover:text-white">{tool.title}</Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <nav aria-label={`${pageGroups[2].title} pages`}>
                        <h2 className="font-mono text-[8px] uppercase tracking-[.24em] text-[#666666]">{pageGroups[2].title}</h2>
                        <ul className="mt-5 space-y-3">
                            {pageGroups[2].links.map((link) => <li key={link.href}><Link href={link.href} className="text-sm text-[#A3A3A3] transition-colors hover:text-white">{link.label}</Link></li>)}
                        </ul>
                    </nav>
                </div>

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
                        <a href="https://github.com/aviorxt" target="_blank" rel="noreferrer" aria-label="aviorxt on GitHub" className="grid size-10 place-items-center border border-[#292929] text-[#858585] transition-colors hover:border-[#666666] hover:text-white"><Github size={15} /></a>
                        <a href="https://www.instagram.com/aviorxt/" target="_blank" rel="noreferrer" aria-label="@aviorxt on Instagram" className="grid size-10 place-items-center border border-[#292929] text-[#858585] transition-colors hover:border-[#666666] hover:text-white"><Instagram size={15} /></a>
                        <a href="mailto:support@avrxt.dev" aria-label="Email avrxt.dev support" className="grid size-10 place-items-center border border-[#292929] text-[#858585] transition-colors hover:border-[#666666] hover:text-white"><Mail size={15} /></a>
                    </nav>
                </div>
            </div>
        </footer>
    );
}
