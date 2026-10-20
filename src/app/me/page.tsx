import type { Metadata } from 'next';
import { connection } from 'next/server';
import { getMeConfigAction } from '@/app/actions/me';
import { buildPageMetadata } from '@/lib/page-metadata';
import MeClient from './MeClient';

type PageProps = {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
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
    return <MeClient config={config} />;
}
