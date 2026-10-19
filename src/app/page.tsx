import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { buildPageMetadata } from '@/lib/page-metadata';
import HomeSubscribe from '@/components/HomeSubscribe';

export const metadata = buildPageMetadata({
    title: 'avrxt (aviorxt) — Independent Developer & Aircraft Maintenance Engineer',
    description: 'Official website of avrxt, also known as aviorxt: an independent developer and aircraft maintenance engineer based in India.',
    keywords: ['avrxt', 'aviorxt', 'independent developer', 'aircraft maintenance engineer', 'India'],
    path: '/',
});

export default function HomePage() {
    return (
        <main className="home-screen page-enter relative flex min-h-screen min-h-[100svh] flex-col overflow-hidden px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))] text-white sm:px-10 lg:px-16">
            <header className="relative z-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-[.2em] text-zinc-400 sm:text-xs">
                <Link href="/" prefetch={false} aria-label="AVRXT / 01 home" className="transition-colors hover:text-white">AVRXT<span className="text-zinc-400"> / 01</span></Link>
                <Link href="/me" prefetch={false} className="group inline-flex items-center gap-2 transition-colors hover:text-white">
                    Profile <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
            </header>

            <section className="relative z-10 mx-auto flex w-full max-w-[90rem] flex-1 flex-col justify-center py-16 sm:py-20">
                <p className="mb-6 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.25em] text-zinc-400 sm:text-xs">
                    <span className="h-px w-7 bg-zinc-500" /> Independent by design
                </p>
                <h1 aria-label="Nothing Special" className="font-[family-name:var(--font-outfit)] text-[clamp(4.2rem,17.8vw,17rem)] font-semibold uppercase leading-[.72] tracking-[-.085em]">
                    <span className="home-word block">Nothing</span>
                    <span className="home-word home-outline-word block">Special</span>
                </h1>
                <div className="home-tagline ml-auto mt-8 flex w-full max-w-[30rem] flex-col items-end gap-4 border-r border-white/35 pr-4 text-right sm:mt-12 sm:pr-6">
                    <p className="font-mono text-[clamp(.62rem,1.4vw,.9rem)] uppercase tracking-[.22em] text-zinc-400 sm:tracking-[.42em]">Just Leave IT</p>
                    <Link href="/tools" prefetch={false} className="group inline-flex min-h-11 items-center gap-3 border border-white/15 bg-white/[.035] px-4 font-mono text-[10px] uppercase tracking-[.16em] text-zinc-300 transition-colors hover:border-white/45 hover:bg-white/[.08] hover:text-white sm:px-5">
                        Explore the tools <ArrowDownRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
                    </Link>
                    <HomeSubscribe />
                </div>
            </section>
        </main>
    );
}
