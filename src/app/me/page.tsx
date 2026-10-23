import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Github, UserRoundX } from 'lucide-react';
import { connection } from 'next/server';
import { getMeConfigAction } from '@/app/actions/me';
import { buildPageMetadata } from '@/lib/page-metadata';
import MeClient from './MeClient';

type PageProps = {
    searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
    await Promise.resolve(searchParams ?? {});

    return buildPageMetadata({
        title: "Profile & Link's",
        description: "Official profile and links for avrxt, also known as aviorxt — an independent developer and aircraft maintenance engineer based in India.",
        keywords: ['avrxt', 'aviorxt', 'profile', 'links', 'independent developer', 'aircraft maintenance engineer', 'India'],
        path: '/me',
    });
}

export default async function MePage() {
    // Render the live profile at request time; public data is shared through Redis.
    await connection();
    const config = await getMeConfigAction();

    if (config.site?.profileEnabled === false) {
        return (
            <main className="relative isolate min-h-screen overflow-hidden px-4 pb-20 pt-28 sm:px-6 sm:pt-36">
                <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-60 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:44px_44px]" />
                <div aria-hidden="true" className="absolute inset-x-0 top-28 -z-10 h-px bg-white/10" />
                <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.18fr_.82fr] lg:items-end lg:gap-16">
                    <section className="page-enter lg:pb-8">
                        <p className="mb-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.3em] text-[#858585]"><span className="h-px w-8 bg-white/30" />AVRXT / Public profile</p>
                        <h1 className="text-[clamp(3.6rem,10vw,7.5rem)] font-semibold uppercase leading-[.74] tracking-[-.08em]">Profile<br /><span className="contact-outline">paused.</span></h1>
                        <p className="mt-8 max-w-md text-sm leading-7 text-[#A3A3A3]">This public profile has been taken offline by its owner. Public profile data and live integrations are unavailable while it is paused.</p>
                        <div className="mt-9 border-y border-[#1F1F1F] font-mono text-[10px] uppercase tracking-[.14em] text-[#858585]"><div className="flex items-center justify-between gap-4 py-4"><span>Profile surface</span><span className="inline-flex items-center gap-2 text-zinc-300"><span className="size-1.5 rounded-full bg-zinc-500" />Offline</span></div><div className="flex items-center justify-between gap-4 border-t border-[#1F1F1F] py-4"><span>Live data feeds</span><span className="text-zinc-500">Disabled</span></div></div>
                    </section>
                    <section className="contact-panel page-enter border border-[#292929] bg-[#080808]/90 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.035)] backdrop-blur-sm sm:p-8 lg:p-10">
                        <div className="flex items-start justify-between gap-6 border-b border-[#1F1F1F] pb-6"><div><p className="font-mono text-[9px] uppercase tracking-[.25em] text-[#666666]">Profile status</p><h2 className="mt-3 text-2xl font-semibold tracking-[-.04em] sm:text-3xl">Access is paused.</h2></div><span className="grid size-11 shrink-0 place-items-center border border-white/10 bg-white/[.025] text-zinc-400"><UserRoundX size={19} /></span></div>
                        <div className="mt-7 border border-[#292929] bg-[#090909] p-5"><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#666666]">A clean offline state</p><p className="mt-3 text-sm leading-6 text-[#A3A3A3]">No profile details, social links, current music, or profile APIs are exposed until the owner enables this page again.</p></div>
                        <div className="mt-7 flex flex-col gap-3 sm:flex-row"><Link href="/" className="group inline-flex min-h-12 flex-1 items-center justify-center gap-3 bg-white px-5 font-mono text-[9px] font-bold uppercase tracking-[.16em] text-black transition-colors hover:bg-[#DEDEDE]">Return home <ArrowUpRight size={14} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link><a href="https://github.com/aviorxt" target="_blank" rel="noreferrer" className="group inline-flex min-h-12 flex-1 items-center justify-center gap-3 border border-[#484848] px-5 font-mono text-[9px] uppercase tracking-[.16em] text-[#D0D0D0] transition-colors hover:border-white hover:text-white"><Github size={14} />GitHub <ArrowUpRight size={13} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a></div>
                    </section>
                </div>
            </main>
        );
    }

    return <MeClient config={config} />;
}
