import Link from 'next/link';
import { ArrowUpRight, Braces, Github, Instagram, MapPin, Plane, ShieldCheck } from 'lucide-react';
import { buildPageMetadata } from '@/lib/page-metadata';

const siteUrl = 'https://www.avrxt.dev';

export const metadata = buildPageMetadata({
  title: 'About avrxt (aviorxt)',
  description: 'Meet avrxt, also known as aviorxt: an independent developer and aircraft maintenance engineer based in India, focused on secure systems, APIs, and automation.',
  keywords: ['avrxt', 'aviorxt', 'about avrxt', 'independent developer India', 'aircraft maintenance engineer India', 'full stack developer', 'API developer', 'web security'],
  path: '/about',
});

const principles = [
  { number: '01', title: 'Precision', body: 'Clear requirements, careful execution, and verification before a system is considered complete.' },
  { number: '02', title: 'Reliability', body: 'Interfaces and infrastructure designed to behave predictably, recover cleanly, and remain maintainable.' },
  { number: '03', title: 'Security', body: 'Practical safeguards, minimal data collection, and deliberate boundaries around every public feature.' },
];

const profileSchema = {
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  '@id': `${siteUrl}/about#profile`,
  url: `${siteUrl}/about`,
  name: 'About avrxt (aviorxt)',
  mainEntity: {
    '@type': 'Person',
    '@id': `${siteUrl}/about#person`,
    name: 'avrxt',
    alternateName: ['aviorxt', '@aviorxt'],
    url: `${siteUrl}/about`,
    jobTitle: 'Independent Developer and Aircraft Maintenance Engineer',
    description: 'Independent developer and aircraft maintenance engineer based in India, building secure web systems, APIs, tools, and automation.',
    address: { '@type': 'PostalAddress', addressCountry: 'IN' },
    knowsAbout: ['Full-stack web development', 'API development', 'Web security', 'AI automation', 'Aircraft maintenance'],
    sameAs: ['https://github.com/aviorxt', 'https://www.instagram.com/aviorxt/'],
  },
};

export default function AboutPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] px-4 pb-24 pt-32 text-white sm:px-6 sm:pb-32 sm:pt-40">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileSchema).replace(/</g, '\\u003c') }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.055),transparent_25%),radial-gradient(circle_at_82%_42%,rgba(255,255,255,0.035),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:64px_64px]" />

      <div className="relative mx-auto max-w-6xl">
        <header className="border-b border-[#1F1F1F] pb-14 sm:pb-20">
          <div className="mb-8 flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[.24em] text-[#A3A3A3]">
            <span className="inline-flex items-center gap-2 border border-[#292929] bg-[#080808] px-3 py-2"><MapPin size={12} /> India</span>
            <span className="inline-flex items-center gap-2 border border-[#292929] bg-[#080808] px-3 py-2"><span className="size-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,.6)]" /> Independent</span>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[.32em] text-[#858585]">// Identity / avrxt aka aviorxt</p>
          <h1 className="mt-6 max-w-5xl font-outfit text-[clamp(3.7rem,11vw,8.5rem)] font-semibold uppercase leading-[.78] tracking-[-.075em]">
            Two fields.<br /><span className="text-[#686868]">One standard.</span>
          </h1>
          <p className="mt-9 max-w-3xl text-base leading-8 text-[#BCBCBC] sm:text-xl sm:leading-9">
            I&apos;m <strong className="font-medium text-white">avrxt</strong>, also known as <strong className="font-medium text-white">aviorxt</strong>—an independent developer and aircraft maintenance engineer based in India. I build secure digital systems with the same respect for precision, procedure, and reliability that aviation demands.
          </p>
        </header>

        <section aria-labelledby="disciplines-title" className="py-14 sm:py-20">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div><p className="font-mono text-[9px] uppercase tracking-[.28em] text-[#858585]">01 / Disciplines</p><h2 id="disciplines-title" className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Built across two worlds.</h2></div>
            <span className="hidden font-mono text-[10px] uppercase tracking-[.2em] text-[#666666] sm:block">Engineering mindset / practical output</span>
          </div>
          <div className="grid gap-px border border-[#1F1F1F] bg-[#1F1F1F] lg:grid-cols-2">
            <article className="group relative overflow-hidden bg-[#080808] p-6 sm:p-9">
              <Braces className="mb-12 size-6 text-[#D0D0D0] transition-transform duration-500 group-hover:rotate-6" />
              <p className="font-mono text-[9px] uppercase tracking-[.24em] text-[#858585]">Independent developer</p>
              <h3 className="mt-3 text-2xl font-semibold">Web systems that stay useful.</h3>
              <p className="mt-5 max-w-xl text-sm leading-7 text-[#A3A3A3]">My work spans full-stack interfaces, APIs, network utilities, automation, authentication, and privacy-conscious product design. The aim is straightforward: ship dependable software without unnecessary noise.</p>
              <div className="mt-8 flex flex-wrap gap-2 font-mono text-[9px] uppercase tracking-[.14em] text-[#BCBCBC]">
                {['Next.js', 'React', 'TypeScript', 'APIs', 'Cloud infrastructure'].map((item) => <span key={item} className="border border-[#292929] bg-black px-3 py-2">{item}</span>)}
              </div>
            </article>
            <article className="group relative overflow-hidden bg-[#080808] p-6 sm:p-9">
              <Plane className="mb-12 size-6 text-[#D0D0D0] transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1" />
              <p className="font-mono text-[9px] uppercase tracking-[.24em] text-[#858585]">Aircraft maintenance engineer</p>
              <h3 className="mt-3 text-2xl font-semibold">Precision beyond the screen.</h3>
              <p className="mt-5 max-w-xl text-sm leading-7 text-[#A3A3A3]">Aircraft maintenance reinforces a disciplined way of thinking: follow the evidence, respect the procedure, document the work, and verify the result. Those habits carry directly into how I approach software and security.</p>
              <div className="mt-8 flex flex-wrap gap-2 font-mono text-[9px] uppercase tracking-[.14em] text-[#BCBCBC]">
                {['Procedure', 'Inspection', 'Traceability', 'Safety', 'Reliability'].map((item) => <span key={item} className="border border-[#292929] bg-black px-3 py-2">{item}</span>)}
              </div>
            </article>
          </div>
        </section>

        <section aria-labelledby="principles-title" className="border-y border-[#1F1F1F] py-14 sm:py-20">
          <p className="font-mono text-[9px] uppercase tracking-[.28em] text-[#858585]">02 / Operating principles</p>
          <h2 id="principles-title" className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">The work behind the work.</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {principles.map((principle) => (
              <article key={principle.number} className="border-l border-[#292929] pl-5">
                <p className="font-mono text-[9px] tracking-[.2em] text-[#858585]">{principle.number}</p>
                <h3 className="mt-5 flex items-center gap-3 text-xl font-semibold"><ShieldCheck size={16} className="text-[#BCBCBC]" />{principle.title}</h3>
                <p className="mt-4 text-sm leading-7 text-[#A3A3A3]">{principle.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-10 py-14 sm:py-20 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[.28em] text-[#858585]">03 / Find me</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">Follow the work, inspect the code, or start a conversation.</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <a href="https://github.com/aviorxt" target="_blank" rel="noreferrer" className="group inline-flex min-h-12 items-center justify-between gap-8 border border-[#292929] bg-[#080808] px-5 font-mono text-[10px] uppercase tracking-[.16em] transition hover:border-[#666666] hover:bg-[#121212]"><span className="flex items-center gap-3"><Github size={15} /> github.com/aviorxt</span><ArrowUpRight size={14} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a>
            <a href="https://www.instagram.com/aviorxt/" target="_blank" rel="noreferrer" className="group inline-flex min-h-12 items-center justify-between gap-8 border border-[#292929] bg-[#080808] px-5 font-mono text-[10px] uppercase tracking-[.16em] transition hover:border-[#666666] hover:bg-[#121212]"><span className="flex items-center gap-3"><Instagram size={15} /> @aviorxt</span><ArrowUpRight size={14} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a>
          </div>
        </section>

        <section className="flex flex-col gap-6 border border-[#292929] bg-[#080808] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-9">
          <div><p className="font-mono text-[9px] uppercase tracking-[.24em] text-[#858585]">Open channel</p><h2 className="mt-2 text-2xl font-semibold">Have a system worth building?</h2></div>
          <div className="flex flex-wrap gap-3"><Link href="/contact" className="inline-flex min-h-12 items-center gap-3 bg-white px-5 font-mono text-[10px] font-bold uppercase tracking-[.16em] text-black transition hover:bg-[#DEDEDE]">Contact avrxt <ArrowUpRight size={14} /></Link><Link href="/docs" className="inline-flex min-h-12 items-center gap-3 border border-[#292929] px-5 font-mono text-[10px] uppercase tracking-[.16em] text-[#D0D0D0] transition hover:border-[#666666] hover:text-white">Read the docs</Link></div>
        </section>
      </div>
    </main>
  );
}
