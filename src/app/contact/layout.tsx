import Link from 'next/link';
import { ArrowUpRight, CircleOff, Github, Mail } from 'lucide-react';
import { buildPageMetadata } from '@/lib/page-metadata';
import { isContactEnabled } from '@/lib/public-feature-config';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
    title: 'Contact',
    description:
        "Direct uplink to avrxt for technical consultations, project inquiries, or architectural discussions. Let's build something exceptional.",
    keywords: ['contact developer', 'technical consultation', 'hire avrxt', 'software engineering help', 'get in touch'],
    path: '/contact',
});

function ContactClosed() {
    return (
        <main className="relative isolate min-h-screen overflow-hidden px-4 pb-20 pt-28 sm:px-6 sm:pt-36">
            <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-60 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:44px_44px]" />
            <div aria-hidden="true" className="absolute inset-x-0 top-28 -z-10 h-px bg-white/10" />
            <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[.82fr_1.18fr] lg:items-end lg:gap-16">
                <section className="page-enter lg:pb-8">
                    <p className="mb-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.3em] text-[#858585]"><span className="h-px w-8 bg-white/30" />Contact / Channel status</p>
                    <h1 className="text-[clamp(3.6rem,10vw,7.5rem)] font-semibold uppercase leading-[.74] tracking-[-.08em]">Signal<br /><span className="contact-outline">paused.</span></h1>
                    <p className="mt-8 max-w-md text-sm leading-7 text-[#A3A3A3]">The direct contact channel is temporarily offline. No messages are being accepted or queued while it is closed.</p>
                    <div className="mt-9 border-y border-[#1F1F1F] font-mono text-[10px] uppercase tracking-[.14em] text-[#858585]"><div className="flex items-center justify-between gap-4 py-4"><span>Channel status</span><span className="inline-flex items-center gap-2 text-zinc-300"><span className="size-1.5 rounded-full bg-zinc-500" />Offline</span></div><div className="flex items-center justify-between gap-4 border-t border-[#1F1F1F] py-4"><span>Message intake</span><span className="text-zinc-500">Disabled</span></div></div>
                </section>
                <section className="contact-panel page-enter border border-[#292929] bg-[#080808]/90 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.035)] backdrop-blur-sm sm:p-8 lg:p-10">
                    <div className="flex items-start justify-between gap-6 border-b border-[#1F1F1F] pb-6"><div><p className="font-mono text-[9px] uppercase tracking-[.25em] text-[#666666]">AVRXT / Contact relay</p><h2 className="mt-3 text-2xl font-semibold tracking-[-.04em] sm:text-3xl">This channel is closed.</h2></div><span className="grid size-11 shrink-0 place-items-center border border-white/10 bg-white/[.025] text-zinc-400"><CircleOff size={19} /></span></div>
                    <div className="mt-7 grid gap-px border border-[#292929] bg-[#292929] sm:grid-cols-2"><div className="bg-[#090909] p-5"><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#666666]">What this means</p><p className="mt-3 text-sm leading-6 text-[#A3A3A3]">The form and its API are unavailable until the owner reopens this channel.</p></div><div className="bg-[#090909] p-5"><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#666666]">No silent delivery</p><p className="mt-3 text-sm leading-6 text-[#A3A3A3]">Messages are not stored, forwarded, or retained while contact is disabled.</p></div></div>
                    <div className="mt-7 flex flex-col gap-3 sm:flex-row"><Link href="/" className="group inline-flex min-h-12 flex-1 items-center justify-center gap-3 bg-white px-5 font-mono text-[9px] font-bold uppercase tracking-[.16em] text-black transition-colors hover:bg-[#DEDEDE]">Return home <ArrowUpRight size={14} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link><a href="https://github.com/aviorxt" target="_blank" rel="noreferrer" className="group inline-flex min-h-12 flex-1 items-center justify-center gap-3 border border-[#484848] px-5 font-mono text-[9px] uppercase tracking-[.16em] text-[#D0D0D0] transition-colors hover:border-white hover:text-white"><Github size={14} />GitHub <ArrowUpRight size={13} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a></div>
                    <p className="mt-5 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.14em] text-[#666666]"><Mail size={12} />Check back when channel status is online.</p>
                </section>
            </div>
        </main>
    );
}

export default async function ContactLayout({ children }: { children: React.ReactNode }) {
    if (await isContactEnabled()) return <>{children}</>;
    return <ContactClosed />;
}
