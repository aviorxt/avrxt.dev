import Link from 'next/link';
import { ArrowUpRight, CalendarDays, FileCheck2, Mail, ShieldCheck } from 'lucide-react';
import Reveal from '@/components/Reveal';

export type PolicyNavItem = { id: string; label: string };

export function PolicyShell({ eyebrow, title, description, version, lastUpdated, nav, highlights, children }: { eyebrow: string; title: string; description: string; version: string; lastUpdated: string; nav: PolicyNavItem[]; highlights: Array<{ label: string; value: string }>; children: React.ReactNode }) {
  return <main className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-24 pt-28 sm:px-6 sm:pt-36">
    <Reveal className="active">
      <header className="relative overflow-hidden border-b border-[#1F1F1F] pb-10 sm:pb-14">
        <div className="pointer-events-none absolute -right-28 -top-36 size-96 rounded-full bg-white/[.035] blur-3xl" />
        <div className="relative grid gap-9 lg:grid-cols-[1fr_20rem] lg:items-end">
          <div><p className="mb-5 font-mono text-[10px] uppercase tracking-[.28em] text-[#666666]">// {eyebrow} / {version}</p><h1 className="max-w-4xl text-[clamp(3.5rem,11vw,8rem)] font-semibold uppercase leading-[.78] tracking-[-.075em] text-white">{title}</h1><p className="mt-7 max-w-2xl text-sm leading-7 text-[#A3A3A3] sm:text-base">{description}</p></div>
          <div className="border border-[#292929] bg-black/70 p-5"><div className="flex items-center gap-3 border-b border-[#1F1F1F] pb-4"><span className="grid size-9 place-items-center border border-[#292929] bg-[#080808]"><FileCheck2 size={15} /></span><div><p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#666666]">Published policy</p><p className="mt-1 text-sm text-[#D0D0D0]">Current version</p></div></div><div className="mt-4 flex items-center gap-2 text-xs text-[#858585]"><CalendarDays size={13} /><span>Updated {lastUpdated}</span></div><a href="mailto:support@avrxt.dev" className="mt-4 inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.16em] text-[#BCBCBC] transition-colors hover:text-white"><Mail size={13} /> support@avrxt.dev</a></div>
        </div>
      </header>

      <section className="grid gap-px border-x border-b border-[#1F1F1F] bg-[#1F1F1F] sm:grid-cols-3">{highlights.map((item) => <div key={item.label} className="bg-black p-5"><p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#666666]">{item.label}</p><p className="mt-2 text-sm font-medium text-[#E5E5E5]">{item.value}</p></div>)}</section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-start">
        <aside className="lg:sticky lg:top-28"><div className="border border-[#1F1F1F] bg-black p-4"><p className="mb-3 font-mono text-[9px] uppercase tracking-[.2em] text-[#666666]">On this page</p><nav className="grid gap-1">{nav.map((item, index) => <a key={item.id} href={`#${item.id}`} className="group flex min-h-10 items-center gap-3 border border-transparent px-2 text-xs text-[#858585] transition-colors hover:border-[#292929] hover:bg-[#080808] hover:text-white"><span className="font-mono text-[8px] text-[#484848]">{String(index + 1).padStart(2, '0')}</span><span>{item.label}</span></a>)}</nav></div><div className="mt-3 flex items-start gap-3 border border-[#1F1F1F] bg-[#080808] p-4"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#858585]" /><p className="text-[11px] leading-5 text-[#686868]">Plain-language summaries help navigation. The full section text controls.</p></div></aside>
        <div className="space-y-4">{children}</div>
      </div>

      <footer className="mt-10 border-t border-[#1F1F1F] pt-6"><p className="mb-4 font-mono text-[9px] uppercase tracking-[.18em] text-[#666666]">Related policies</p><div className="flex flex-wrap gap-2">{[['Privacy', '/privacy'], ['Terms', '/terms'], ['Refunds', '/refund'], ['Security', '/security']].map(([label, href]) => <Link key={href} href={href} className="inline-flex min-h-10 items-center gap-2 border border-[#292929] bg-black px-4 font-mono text-[9px] uppercase tracking-[.14em] text-[#A3A3A3] transition-all hover:-translate-y-0.5 hover:border-[#686868] hover:text-white">{label}<ArrowUpRight size={12} /></Link>)}</div></footer>
    </Reveal>
  </main>;
}

export function PolicySection({ id, number, title, children }: { id: string; number: string; title: string; children: React.ReactNode }) {
  return <section id={id} className="legal-section scroll-mt-28 overflow-hidden border border-[#1F1F1F] bg-black"><header className="flex items-center gap-4 border-b border-[#1F1F1F] p-5 sm:p-6"><span className="grid size-9 shrink-0 place-items-center border border-[#292929] bg-[#080808] font-mono text-[9px] text-[#858585]">{number}</span><h2 className="text-lg font-semibold tracking-[-.025em] text-white sm:text-xl">{title}</h2></header><div className="space-y-4 p-5 text-sm leading-7 text-[#A3A3A3] [overflow-wrap:anywhere] sm:p-7 [&_strong]:font-medium [&_strong]:text-[#E5E5E5] [&_a]:text-[#E5E5E5] [&_a]:underline [&_a]:decoration-[#484848] [&_a]:underline-offset-4 [&_a:hover]:decoration-white">{children}</div></section>;
}

export function PolicyList({ items }: { items: React.ReactNode[] }) {
  return <ul className="grid gap-2">{items.map((item, index) => <li key={index} className="flex items-start gap-3 border border-[#1F1F1F] bg-[#080808] px-4 py-3"><span className="mt-2 size-1 shrink-0 rounded-full bg-[#858585]" /><span>{item}</span></li>)}</ul>;
}

export function PolicyCallout({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="border-l-2 border-white bg-white/[.035] p-4"><p className="mb-1 font-mono text-[9px] uppercase tracking-[.18em] text-[#D0D0D0]">{title}</p><div className="text-xs leading-6 text-[#858585]">{children}</div></div>;
}
