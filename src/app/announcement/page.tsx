import Link from 'next/link';
import { ArrowUpRight, BadgeCheck, Globe2, MailCheck, ShieldAlert, TriangleAlert } from 'lucide-react';
import { buildPageMetadata } from '@/lib/page-metadata';

export const metadata = buildPageMetadata({
  title: 'Security announcement',
  description: 'An official AVRXT notice about impersonation attempts, verified mail domains, trusted redirect links, and reporting suspicious claims.',
  keywords: ['avrxt security notice', 'avrxt official domains', 'avrxt phishing warning', 'avrxt impersonation report'],
  path: '/announcement',
});

const mailDomains = ['@avrxt.dev', '@notify.avrxt.dev', '@avrxt.me', '@mail.avrxt.me'];
const officialDomains = ['avrxt.space', 'avrxt.me', 'avrxt.dev'];
const reportedSites = ['avrxt-dev.vercel.app', 'avr-xt.is-a.dev'];

export default function AnnouncementPage() {
  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#050505] px-4 pb-24 pt-28 text-white sm:px-6 sm:pb-32 sm:pt-36">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.026)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.026)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />
      <div className="pointer-events-none absolute -top-64 left-1/2 size-[42rem] -translate-x-1/2 rounded-full bg-red-500/[.07] blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        <header className="border-b border-[#1F1F1F] pb-10 sm:pb-14">
          <div className="mb-8 flex w-fit items-center gap-2 border border-red-300/30 bg-red-300/[.07] px-3 py-2 font-mono text-[9px] uppercase tracking-[.18em] text-red-100 sm:text-[10px]">
            <TriangleAlert size={13} aria-hidden="true" /> Security announcement / 2026
          </div>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-end">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[.28em] text-[#858585]">Trust notice / Official identity</p>
              <h1 className="mt-5 max-w-4xl text-[clamp(3.5rem,11vw,8rem)] font-semibold uppercase leading-[.78] tracking-[-.075em] text-white">Verify before<br /><span className="text-[#686868]">you trust.</span></h1>
              <p className="mt-7 max-w-2xl text-base leading-8 text-[#BCBCBC] sm:text-lg">We are aware of websites claiming to represent AVRXT. Do not click links, reply to messages, share credentials, or send money until the sender and destination have been verified.</p>
            </div>
            <div className="border border-[#3E2A2A] bg-[#110909]/80 p-5 sm:p-6">
              <ShieldAlert size={20} className="text-red-200" aria-hidden="true" />
              <p className="mt-5 font-mono text-[9px] uppercase tracking-[.18em] text-red-100">Important</p>
              <p className="mt-2 text-sm leading-6 text-[#D0B7B7]">AVRXT is not responsible for loss caused by an impersonating website, message, or payment request. Pause and verify first.</p>
            </div>
          </div>
        </header>

        <section className="grid gap-px border-x border-b border-[#1F1F1F] bg-[#1F1F1F] sm:grid-cols-3" aria-label="Official identity summary">
          <div className="bg-black p-5"><p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#666666]">Official mail families</p><p className="mt-2 text-sm font-medium text-[#E5E5E5]">04 verified suffixes</p></div>
          <div className="bg-black p-5"><p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#666666]">Trusted redirects</p><p className="mt-2 text-sm font-medium text-[#E5E5E5]">go.avrxt.dev only</p></div>
          <div className="bg-black p-5"><p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#666666]">Reported sites</p><p className="mt-2 text-sm font-medium text-[#E5E5E5]">Do not interact</p></div>
        </section>

        <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,.85fr)]">
          <section className="border border-[#1F1F1F] bg-black" aria-labelledby="official-title">
            <header className="flex items-center gap-4 border-b border-[#1F1F1F] p-5 sm:p-7"><span className="grid size-10 place-items-center border border-[#292929] bg-[#080808]"><MailCheck size={17} /></span><div><p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#666666]">01 / Email verification</p><h2 id="official-title" className="mt-1 text-xl font-semibold tracking-[-.03em]">Official AVRXT mail</h2></div></header>
            <div className="p-5 sm:p-7">
              <p className="max-w-2xl text-sm leading-7 text-[#A3A3A3]">AVRXT only sends email from addresses ending in one of the following domains. A display name alone is not proof of identity—inspect the complete sender address before you act.</p>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">{mailDomains.map((domain) => <code key={domain} className="flex min-h-12 items-center border border-[#292929] bg-[#080808] px-4 font-mono text-xs text-[#E5E5E5]">{domain}</code>)}</div>
              <div className="mt-6 border-l-2 border-white bg-white/[.035] p-4"><p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#D0D0D0]">Link rule</p><p className="mt-2 text-xs leading-6 text-[#A3A3A3]">Only follow AVRXT redirect links that begin exactly with <code className="text-[#E5E5E5]">https://go.avrxt.dev/</code>. Check the full URL before opening it. If the address differs, treat it as untrusted.</p></div>
            </div>
          </section>

          <section className="border border-[#1F1F1F] bg-[#080808] p-5 sm:p-7" aria-labelledby="domains-title">
            <div className="flex items-center gap-3"><Globe2 size={17} className="text-[#A3A3A3]" /><div><p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#666666]">02 / Domain registry</p><h2 id="domains-title" className="mt-1 text-xl font-semibold tracking-[-.03em]">AVRXT domains / 2026</h2></div></div>
            <ul className="mt-6 space-y-2">{officialDomains.map((domain) => <li key={domain} className="flex items-center gap-3 border border-[#292929] bg-black px-4 py-3 font-mono text-xs text-[#D0D0D0]"><BadgeCheck size={14} className="shrink-0 text-white" aria-hidden="true" />{domain}</li>)}</ul>
            <p className="mt-5 text-xs leading-6 text-[#858585]">A legitimate service may use a verified subdomain of an official domain. Carefully read the complete address; extra words, misspellings, and unfamiliar root domains are warning signs.</p>
          </section>
        </div>

        <section className="mt-5 border border-red-300/20 bg-[#0B0808]" aria-labelledby="reported-title">
          <header className="flex flex-col gap-4 border-b border-red-300/15 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7"><div><p className="font-mono text-[9px] uppercase tracking-[.18em] text-red-100">03 / Reported impersonation claims</p><h2 id="reported-title" className="mt-2 text-2xl font-semibold tracking-[-.035em]">Do not click or interact.</h2></div><span className="w-fit border border-red-300/20 px-3 py-2 font-mono text-[8px] uppercase tracking-[.16em] text-red-100">Unverified destinations</span></header>
          <div className="grid gap-px bg-red-300/10 sm:grid-cols-2">{reportedSites.map((site) => <div key={site} className="bg-[#0B0808] p-5 sm:p-7"><p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#8F6868]">Reported to claim AVRXT identity</p><code className="mt-3 block break-all text-sm text-red-100">{site}</code><p className="mt-3 text-xs leading-6 text-[#A68787]">This destination is not an official AVRXT website. Do not sign in, download files, submit forms, or make payments there.</p></div>)}</div>
        </section>

        <section className="mt-5 flex flex-col gap-6 border border-[#292929] bg-[#080808] p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#858585]">See something suspicious?</p><h2 className="mt-2 text-2xl font-semibold tracking-[-.035em]">Report it before engaging.</h2><p className="mt-2 max-w-2xl text-sm leading-7 text-[#A3A3A3]">Include the sender address or URL, a screenshot, and the approximate time. Do not include passwords, account tokens, or private payment details.</p></div>
          <div className="flex flex-wrap gap-3"><a href="https://www.elvnx.tech/report/avrxt.dev" target="_blank" rel="noreferrer" className="group inline-flex min-h-12 items-center gap-3 bg-white px-5 font-mono text-[9px] font-bold uppercase tracking-[.16em] text-black transition-colors hover:bg-[#DEDEDE]">Report impersonation <ArrowUpRight size={14} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a><Link href="/contact" className="inline-flex min-h-12 items-center gap-3 border border-[#484848] px-5 font-mono text-[9px] uppercase tracking-[.16em] text-[#D0D0D0] transition-colors hover:border-white hover:text-white">Contact AVRXT</Link></div>
        </section>
      </div>
    </main>
  );
}
