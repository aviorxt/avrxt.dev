'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Search, Command } from 'lucide-react';
import { cn } from '@/lib/utils';
import Magnetic from '@/components/Magnetic';
import SiteSearch from '@/components/SiteSearch';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const pathname = usePathname();

    const isHiddenRoute = pathname.startsWith('/me') || pathname.startsWith('/docs/admin');

    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'About', href: '/about' },
        { name: 'Docs', href: '/docs' },
        { name: 'Tools', href: '/tools' },
    ];

    const handleToggleMenu = () => {
        setIsOpen((prev) => !prev);
        setIsSearchOpen(false);
    };

    const handleToggleSearch = () => {
        setIsSearchOpen((prev) => !prev);
        setIsOpen(false);
    };

    useEffect(() => {
        if (!isOpen && !isSearchOpen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = previousOverflow; };
    }, [isOpen, isSearchOpen]);

    // Keyboard listeners
    useEffect(() => {
        if (isHiddenRoute) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
                setIsSearchOpen(false);
            }
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsSearchOpen(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isHiddenRoute]);

    if (isHiddenRoute) {
        return null;
    }

    return (
        <>
            <header
                className={cn(
                    "absolute left-0 right-0 top-[max(1rem,env(safe-area-inset-top))] flex justify-center px-3 sm:top-6 sm:px-6 pointer-events-none transition-all duration-500",
                    (isOpen || isSearchOpen) ? "z-[300]" : "z-[100]"
                )}
            >
                <nav className="v7-navbar relative flex items-center bg-[#080808]/90 backdrop-blur-2xl border border-white/10 px-2 py-2 shadow-[0_20px_60px_rgba(0,0,0,0.7)] transition-all duration-500 hover:border-cyan-300/25 pointer-events-auto">
                    {/* Logo */}
                    <Magnetic>
                        <Link href="/" prefetch={false} className="px-4 py-2 transition-transform hover:scale-110 active:scale-95 flex items-center">
                            <img
                                src="/assets/logo/avrxt-pure-white.png"
                                alt="avrxt"
                                className="h-[22px] w-auto translate-y-[2px]"
                            />
                        </Link>
                    </Magnetic>

                    {/* Nav Links - Desktop */}
                    <div className="hidden sm:flex items-center gap-1 relative">
                        {navLinks.map((link) => {
                            const isActive = link.href === pathname || (link.href.startsWith('/#') && pathname === '/');
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    prefetch={false}
                                    className={cn(
                                        "px-4 py-2 text-[11px] font-mono uppercase tracking-[0.16em] transition-colors relative z-10 border-l border-white/5",
                                        isActive ? "text-cyan-300 bg-cyan-300/[0.06]" : "text-zinc-500 hover:text-white hover:bg-white/[0.03]"
                                    )}
                                >
                                    {link.name}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Desktop Search Trigger */}
                    <Magnetic>
                        <button
                            onClick={handleToggleSearch}
                            aria-label="Open site search"
                            className="hidden sm:flex items-center gap-3 px-4 py-2 hover:bg-cyan-300/[0.06] transition-all group border-l border-white/5"
                        >
                            <Search className="w-3 h-3 group-hover:text-white transition-colors" />
                            <span className="text-[11px] font-mono opacity-50 uppercase tracking-widest hidden lg:block">Search</span>
                            <div className="flex items-center gap-1 border border-white/10 bg-black/40 px-1.5 py-0.5 rounded text-[9px] font-mono text-zinc-600">
                                <Command className="w-2.5 h-2.5" />
                                <span>K</span>
                            </div>
                        </button>
                    </Magnetic>

                    {/* Mobile Icons */}
                    <div className="flex sm:hidden items-center gap-1">
                        <Magnetic>
                            <button
                                type="button"
                                onClick={handleToggleSearch}
                                aria-label="Open site search"
                                className="flex min-h-11 min-w-11 items-center justify-center p-2 text-zinc-400 transition-colors hover:text-white"
                            >
                                <Search className="w-4 h-4" />
                            </button>
                        </Magnetic>
                        <Magnetic>
                            <button
                                type="button"
                                onClick={handleToggleMenu}
                                aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
                                aria-expanded={isOpen}
                                aria-controls="mobile-site-menu"
                                className="flex min-h-11 min-w-11 items-center justify-center gap-2 border-l border-white/10 bg-white/5 p-2.5 transition-all hover:bg-white/10 active:scale-95 group"
                            >
                                {isOpen && (
                                    <span className="text-[8px] font-mono text-cyan-300 uppercase tracking-widest animate-pulse">
                                        ESC
                                    </span>
                                )}
                                {isOpen ? <X className="w-4 h-4 text-cyan-300" /> : <Menu className="w-4 h-4" />}
                            </button>
                        </Magnetic>
                    </div>
                </nav>
            </header>

            {isSearchOpen && <SiteSearch onClose={() => setIsSearchOpen(false)} />}

            {/* Mobile Menu */}
            {isOpen && (
                <nav id="mobile-site-menu" aria-label="Mobile site navigation" className="fixed inset-0 z-[200] flex min-h-[100dvh] flex-col overflow-y-auto overscroll-contain bg-[#050505] px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(6rem,calc(env(safe-area-inset-top)+4.5rem))] animate-fade-in sm:px-10">
                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:32px_32px]"></div>
                    <div className="absolute top-0 right-0 w-full h-[50vh] bg-gradient-to-b from-cyan-400/[0.06] via-blue-500/[0.03] to-transparent pointer-events-none" />

                    <div className="relative z-10 space-y-3">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="h-px w-6 bg-zinc-800" />
                            <span className="text-[10px] font-mono text-zinc-700 uppercase tracking-[0.4em]">Directory_v5.2</span>
                        </div>
                        {navLinks.map((link, i) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                prefetch={false}
                                onClick={() => setIsOpen(false)}
                                className="group block min-h-12 w-fit max-w-full py-1 text-[clamp(2.75rem,13vw,4rem)] font-black leading-none tracking-tighter text-zinc-500 transition-all hover:translate-x-2 hover:text-white active:scale-[.98] origin-left"
                                style={{ transitionDelay: `${i * 50}ms` }}
                            >
                                <span className="inline-block group-hover:italic group-hover:tracking-normal transition-all duration-300">
                                    {link.name}
                                </span>
                            </Link>
                        ))}
                        <Link
                            href="/me"
                            prefetch={false}
                            onClick={() => setIsOpen(false)}
                            className="group block min-h-12 w-fit max-w-full py-1 text-[clamp(2.75rem,13vw,4rem)] font-black leading-none tracking-tighter text-zinc-500 transition-all hover:translate-x-2 hover:text-white active:scale-[.98] origin-left"
                        >
                            /me
                        </Link>
                    </div>

                    <div className="relative z-10 mt-auto pt-10 pb-4 sm:pb-8">
                        <Link
                            href="/contact"
                            prefetch={false}
                            onClick={() => setIsOpen(false)}
                            className="block min-h-12 w-full border border-white bg-white px-5 py-4 text-center text-xs font-black uppercase tracking-widest text-black shadow-[0_30px_60px_rgba(255,255,255,0.05)] transition-all active:scale-[.98] sm:py-6"
                        >
                            Initiate_Contact_
                        </Link>
                    </div>
                </nav>
            )}
        </>
    );
}
