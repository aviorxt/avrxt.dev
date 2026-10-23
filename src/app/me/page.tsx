import type { Metadata } from 'next';
import Link from 'next/link';
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
            <main className="grid min-h-screen place-items-center bg-black px-6 text-white">
                <section className="w-full max-w-xl border border-white/10 bg-zinc-950 p-8 text-center shadow-2xl sm:p-12">
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">AVRXT / Profile</p>
                    <h1 className="mt-5 text-3xl font-bold uppercase tracking-tight sm:text-4xl">Profile unavailable</h1>
                    <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-zinc-400">This public profile is currently disabled by its owner.</p>
                    <Link href="/" className="mt-8 inline-flex border border-white/20 px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] transition-colors hover:bg-white hover:text-black">Return home</Link>
                </section>
            </main>
        );
    }

    return <MeClient config={config} />;
}
