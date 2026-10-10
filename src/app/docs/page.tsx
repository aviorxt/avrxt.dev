import { BookOpen } from 'lucide-react';
import { getPublishedDocs } from '@/app/actions/docs';
import DocsClient from './DocsClient';
import Reveal from '@/components/Reveal';
import { buildPageMetadata } from '@/lib/page-metadata';

export const metadata = buildPageMetadata({
    title: 'Docs',
    description: 'Explore in-depth technical guides, architectural deep dives, and performance optimization tutorials by avrxt.',
    keywords: ['technical documentation', 'coding tutorials', 'system architecture', 'software engineering guides', 'avrxt library'],
    path: '/docs',
});

export const revalidate = 60;

export default async function Docs() {
    const articles = await getPublishedDocs();

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#050505] pt-14 font-sans text-gray-300 selection:bg-white/10 selection:text-white sm:pt-20">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="docs-glow absolute top-[-10%] right-[-10%] w-[70%] h-[50%] bg-white/[.02] blur-[120px] rounded-full animate-pulse" />
                <div className="docs-glow absolute bottom-[-10%] left-[-10%] w-[70%] h-[50%] bg-white/[.015] blur-[120px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
            </div>

            <main className="relative z-10 mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-24">
                <section className="mb-14 sm:mb-24">
                    <Reveal direction="down" delay={0.1}>
                        <p className="mb-5 font-mono text-[9px] uppercase tracking-[.25em] text-zinc-400 sm:mb-6 sm:text-[10px] sm:tracking-[0.5em]">// System_Documentation_Uplink</p>
                        <h1 className="mb-6 text-[clamp(3rem,12vw,5.5rem)] font-black leading-[.88] tracking-tighter text-white sm:mb-8 md:text-8xl">
                            The Archives.
                        </h1>
                        <p className="max-w-3xl border-l border-white/10 pl-4 text-base leading-7 text-zinc-400 italic sm:pl-6 sm:text-lg md:text-xl">
                            A curated selection of technical intelligence, architectural patterns, and performance protocols for the modern decentralized web.
                        </p>
                        <div className="mt-12 flex items-center gap-4 text-[9px] font-mono text-zinc-600 uppercase tracking-[0.3em]">
                            <div className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                                {articles.length} CORE_ARTICLES
                            </div>
                            <span className="opacity-20">|</span>
                            <span>NODE_VER: 5.2.0</span>
                        </div>
                    </Reveal>
                </section>

                <hr className="mb-14 border-white/5 sm:mb-24" />

                <section>
                    <Reveal className="mb-12" direction="up" delay={0.2}>
                        <h2 className="text-xl font-bold text-white mb-2 font-mono flex items-center gap-3 uppercase tracking-widest">
                            <BookOpen className="text-emerald-500 w-5 h-5" /> Knowledge_Base
                        </h2>
                        <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest ml-8">Proprietary protocols and engineering notes</p>
                    </Reveal>

                    <DocsClient articles={articles} />
                </section>
            </main>
        </div>
    );
}
