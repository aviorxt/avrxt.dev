import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { buildPageMetadata } from '@/lib/page-metadata';
import HomeSubscribe from '@/components/HomeSubscribe';
import { getPublicProfileRecord } from '@/lib/public-data';
import { connection } from 'next/server';
import { SITE_TITLE, SITE_DESCRIPTION } from '@/lib/site-identity';

export const metadata = buildPageMetadata({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    keywords: ['avrxt', 'aviorxt', 'independent developer', 'aircraft maintenance engineer', 'India'],
    path: '/',
});

export default async function HomePage() {
    await connection();
    const config = await getPublicProfileRecord().catch(() => null);
    const showNewsletter = config?.site?.newsletterEnabled !== false && config?.site?.newsletterShowHome !== false;
    return (
        <div className="home-screen relative flex min-h-screen min-h-[100svh] flex-col overflow-x-hidden px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))] text-white sm:px-10 lg:px-16">
            <header className="relative z-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-[.2em] text-zinc-400 sm:text-xs">
                <Link href="/" prefetch={false} aria-label="AVRXT / 01 home" className="transition-colors hover:text-white">AVRXT<span className="text-zinc-400"> / 01</span></Link>
                <Link href="https://me.avrxt.dev" prefetch={false} className="group inline-flex items-center gap-2 transition-colors hover:text-white">
                    Profile <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
            </header>

            <section className="relative z-10 mx-auto flex w-full max-w-[90rem] flex-1 flex-col justify-center pb-36 pt-16 sm:pb-40 sm:pt-20">
                <p className="mb-6 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.25em] text-zinc-400 sm:text-xs">
                    <span className="h-px w-7 bg-zinc-500" /> Independent by design
                </p>
                <p aria-label="Nothing Special" className="font-[family-name:var(--font-outfit)] text-[clamp(4.2rem,17.8vw,17rem)] font-semibold uppercase leading-[.72] tracking-[-.085em]">
                    <span className="home-word block">Nothing</span>
                    <span className="home-word home-outline-word block">Special</span>
                </p>
                <section aria-labelledby="home-identity" className="home-tagline ml-auto mt-10 w-full max-w-[38rem] border-t border-white/20 sm:mt-14">
                    <div className="flex items-center justify-between gap-4 py-4 font-mono text-[9px] uppercase tracking-[.18em] text-zinc-500">
                        <span>01 / The person behind it</span>
                        <span>India <span className="ml-2 inline-block size-1 bg-white/70" /></span>
                    </div>
                    <div className="grid gap-5 pb-7 sm:grid-cols-[.9fr_1.1fr] sm:gap-8 sm:pb-9">
                        <h1 id="home-identity" className="font-[family-name:var(--font-outfit)] leading-none tracking-[-.06em]">
                            <span className="block text-6xl font-medium sm:text-7xl">avrxt<span className="text-zinc-600">.</span></span>
                            <span className="mt-3 block font-mono text-[9px] font-normal uppercase tracking-[.17em] text-zinc-400">Independent developer</span>
                        </h1>
                        <div className="flex flex-col justify-end gap-4">
                            <p className="max-w-xs text-sm leading-6 text-zinc-300">Web applications. APIs. Small tools that solve real problems.</p>
                            <p className="font-mono text-[9px] uppercase tracking-[.12em] text-zinc-500">Personal website / aviorxt / avr.xt</p>
                        </div>
                    </div>
                    <nav aria-label="Explore avrxt" className="grid grid-cols-2 border-t border-white/15">
                        {[
                            { number: '01', label: 'The person', detail: 'About & approach', href: '/about' },
                            { number: '02', label: 'The workshop', detail: 'Tools & experiments', href: '/tools' },
                            { number: '03', label: 'Field notes', detail: 'Writing & documentation', href: 'https://docs.avrxt.dev' },
                            { number: '04', label: 'Muzix', detail: 'A listening journal', href: 'https://muzix.avrxt.dev' },
                        ].map(({ number, label, detail, href }, index) => (
                            <Link key={href} href={href} className={`group relative flex min-h-24 items-start gap-3 border-b border-white/15 py-5 transition-colors duration-300 hover:bg-white/[.04] focus-visible:bg-white/[.04] focus-visible:outline focus-visible:outline-white/60 ${index % 2 === 0 ? 'border-r pr-4' : 'pl-4'}`}>
                                <span className="pt-1 font-mono text-[8px] text-zinc-600 transition-colors group-hover:text-zinc-300">{number}</span>
                                <span className="flex flex-1 flex-col gap-1.5"><span className="text-sm font-medium tracking-tight text-zinc-200">{label}</span><span className="text-[10px] text-zinc-500">{detail}</span></span>
                                <ArrowUpRight size={13} className="mt-1 shrink-0 text-zinc-600 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
                            </Link>
                        ))}
                    </nav>
                    <div className="flex items-center justify-between gap-4 pt-4 font-mono text-[9px] uppercase tracking-[.15em]">
                        <span className="text-zinc-600">Just Leave IT</span>
                        <Link href="/contact" className="inline-flex min-h-10 items-center gap-3 text-zinc-400 transition-colors hover:text-white">Start a conversation <ArrowUpRight size={12} /></Link>
                    </div>
                </section>
                {showNewsletter && (
                    <div className="ml-auto mt-6 w-full max-w-[38rem]">
                        <HomeSubscribe />
                    </div>
                )}
            </section>
        </div>
    );
}
