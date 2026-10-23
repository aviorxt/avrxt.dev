import Link from 'next/link';
import { ArrowUpRight, FileWarning, ShieldAlert } from 'lucide-react';
import { buildPageMetadata } from '@/lib/page-metadata';

export const metadata = buildPageMetadata({
  title: 'Announcements',
  description: 'Official AVRXT announcements, security notices, and detailed public issue reports.',
  keywords: ['avrxt announcements', 'avrxt security notices', 'avrxt issue reports'],
  path: '/announcements',
});

const reports = [
  {
    slug: 'identity-impersonation-notice',
    category: 'Security notice',
    title: 'Identity impersonation notice',
    summary: 'Official email domains, trusted redirect rules, reported look-alike websites, and safe reporting instructions.',
    status: 'Active notice',
    published: '23 October 2026',
  },
];

export default function AnnouncementsPage() {
  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#050505] px-3 pb-16 pt-24 text-white sm:px-6 sm:pb-32 sm:pt-36">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.026)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.026)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />
      <div className="pointer-events-none absolute -top-64 left-1/2 size-[42rem] -translate-x-1/2 rounded-full bg-white/[.055] blur-3xl" />
      <div className="relative mx-auto max-w-6xl">
        <header className="border-b border-[#1F1F1F] pb-10 sm:pb-14">
          <div className="grid gap-7 sm:gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-end">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[.28em] text-[#858585]">Public record / AVRXT</p>
              <h1 className="mt-4 max-w-4xl text-[clamp(2.85rem,14vw,8rem)] font-semibold uppercase leading-[.82] tracking-[-.075em] text-white sm:mt-5 sm:leading-[.78]">Official<br /><span className="text-[#686868]">announcements.</span></h1>
              <p className="mt-6 max-w-2xl text-[15px] leading-7 text-[#BCBCBC] sm:mt-7 sm:text-lg sm:leading-8">A permanent public record for security notices, service communications, and detailed issue reports published by AVRXT.</p>
            </div>
            <aside className="border border-[#292929] bg-black/70 p-4 sm:p-6"><ShieldAlert size={19} className="text-[#D0D0D0]" aria-hidden="true" /><p className="mt-4 font-mono text-[9px] uppercase tracking-[.18em] text-[#858585] sm:mt-5">Verification rule</p><p className="mt-2 text-sm leading-6 text-[#A3A3A3]">If a message is not listed or linked here, verify it through an official AVRXT contact channel before acting.</p></aside>
          </div>
        </header>

        <section className="mt-6 grid gap-px border border-[#1F1F1F] bg-[#1F1F1F] grid-cols-2 sm:mt-8 sm:grid-cols-3" aria-label="Announcement summary">
          <div className="bg-black p-4 sm:p-5"><p className="font-mono text-[8px] uppercase tracking-[.16em] text-[#666666] sm:text-[9px] sm:tracking-[.18em]">Published reports</p><p className="mt-2 text-xl font-semibold tracking-[-.04em] sm:text-2xl">{String(reports.length).padStart(2, '0')}</p></div>
          <div className="bg-black p-4 sm:p-5"><p className="font-mono text-[8px] uppercase tracking-[.16em] text-[#666666] sm:text-[9px] sm:tracking-[.18em]">Active notices</p><p className="mt-2 text-xl font-semibold tracking-[-.04em] sm:text-2xl">01</p></div>
          <div className="col-span-2 border-t border-[#1F1F1F] bg-black p-4 sm:col-span-1 sm:border-l sm:border-t-0 sm:p-5"><p className="font-mono text-[8px] uppercase tracking-[.16em] text-[#666666] sm:text-[9px] sm:tracking-[.18em]">Report channel</p><p className="mt-2 text-sm font-medium text-[#E5E5E5]">Contact AVRXT</p></div>
        </section>

        <section className="mt-7 sm:mt-8" aria-labelledby="reports-title">
          <div className="mb-4 flex items-end justify-between gap-4"><div><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#666666]">Issue archive</p><h2 id="reports-title" className="mt-2 text-2xl font-semibold tracking-[-.035em]">Current reports</h2></div><span className="hidden font-mono text-[8px] uppercase tracking-[.16em] text-[#666666] sm:block">Newest first</span></div>
          <div className="grid gap-3">{reports.map((report) => <article key={report.slug} className="group border border-[#1F1F1F] bg-black transition-colors hover:border-[#555555]"><Link href={`/announcements/${report.slug}`} className="grid min-h-44 gap-4 p-4 sm:min-h-0 sm:gap-5 sm:p-7 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center"><span className="grid size-11 place-items-center border border-[#292929] bg-[#080808] text-[#D0D0D0]"><FileWarning size={18} /></span><div><div className="flex flex-wrap items-center gap-2 font-mono text-[8px] uppercase tracking-[.16em]"><span className="text-[#858585]">{report.category}</span><span className="size-1 rounded-full bg-[#484848]" /><span className="text-[#D0D0D0]">{report.status}</span></div><h3 className="mt-3 text-lg font-semibold tracking-[-.03em] text-white sm:text-xl">{report.title}</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-[#A3A3A3]">{report.summary}</p></div><div className="flex items-center justify-between gap-4 lg:flex-col lg:items-end"><span className="font-mono text-[8px] uppercase tracking-[.16em] text-[#666666]">{report.published}</span><ArrowUpRight size={16} className="text-[#858585] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" /></div></Link></article>)}</div>
        </section>

        <section className="mt-7 border border-[#292929] bg-[#080808] p-5 sm:mt-8 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-8"><div><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#858585]">Suspicious message or site?</p><p className="mt-2 text-sm leading-7 text-[#A3A3A3]">Preserve the sender address, URL, screenshot, and time. Do not send passwords, codes, or account tokens in a report.</p></div><Link href="/contact" className="mt-5 inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-3 bg-white px-5 font-mono text-[9px] font-bold uppercase tracking-[.16em] text-black transition-colors hover:bg-[#DEDEDE] sm:mt-0 sm:w-auto">Contact AVRXT <ArrowUpRight size={14} /></Link></section>
      </div>
    </main>
  );
}
