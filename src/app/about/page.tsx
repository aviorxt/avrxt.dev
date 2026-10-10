import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Braces, Github, Instagram, MapPin, Plane, ShieldCheck } from 'lucide-react';
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
    <main className="about-premium relative min-h-screen overflow-x-clip bg-[#050505] px-4 pb-24 pt-28 text-white sm:px-6 sm:pb-32 sm:pt-36">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profileSchema).replace(/</g, '\\u003c') }} />
      <div className="about-ambient pointer-events-none absolute inset-x-0 top-0 h-[54rem]" />
      <div className="about-grid pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-6xl">
        <header className="grid min-h-[min(47rem,82svh)] items-center gap-12 border-b border-[#1F1F1F] pb-16 lg:grid-cols-[1.3fr_.7fr] lg:gap-16">
          <div className="about-rise">
            <div className="mb-8 flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-[.2em] text-[#A3A3A3] sm:text-[10px]">
              <span className="inline-flex items-center gap-2 border border-[#292929] bg-black/60 px-3 py-2"><MapPin size={12} /> India</span>
              <span className="inline-flex items-center gap-2 border border-[#292929] bg-black/60 px-3 py-2"><span className="about-signal size-1.5 rounded-full bg-white" /> Independent practice</span>
            </div>
            <p className="font-mono text-[9px] uppercase tracking-[.3em] text-[#858585] sm:text-[10px]">Identity / avrxt aka aviorxt</p>
            <h1 className="mt-6 max-w-4xl font-outfit text-[clamp(3.65rem,10.5vw,8.6rem)] font-semibold uppercase leading-[.76] tracking-[-.078em]">
              Built for{' '}<br /><span className="about-outline">precision.</span>
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-8 text-[#BCBCBC] sm:text-lg sm:leading-9">
              I&apos;m <strong className="font-medium text-white">avrxt</strong>, also known as <strong className="font-medium text-white">aviorxt</strong>—an independent developer and aircraft maintenance engineer based in India. I build secure digital systems with the same respect for procedure and reliability that aviation demands.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/contact" className="group inline-flex min-h-12 items-center gap-3 bg-white px-5 font-mono text-[9px] font-bold uppercase tracking-[.17em] text-black transition-colors hover:bg-[#DEDEDE]">Start a conversation <ArrowUpRight size={14} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>
              <Link href="/tools" className="group inline-flex min-h-12 items-center gap-3 border border-[#292929] bg-black/40 px-5 font-mono text-[9px] uppercase tracking-[.17em] text-[#D0D0D0] transition-colors hover:border-[#666666] hover:text-white">Explore tools <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></Link>
            </div>
          </div>

          <div className="about-rise about-delay relative mx-auto aspect-square w-full max-w-[25rem]" aria-hidden="true">
            <div className="about-orbit absolute inset-[8%] rounded-full border border-white/10" />
            <div className="about-orbit about-orbit-reverse absolute inset-[22%] rounded-full border border-dashed border-white/15" />
            <div className="absolute inset-[36%] grid place-items-center rounded-full border border-[#484848] bg-[#080808] shadow-[0_0_80px_rgba(255,255,255,.08)]">
              <span className="font-outfit text-3xl font-semibold tracking-[-.08em]">AX</span>
            </div>
            <div className="absolute left-[3%] top-[46%] flex items-center gap-2 border border-[#292929] bg-[#080808]/95 px-3 py-2 font-mono text-[8px] uppercase tracking-[.16em] text-[#A3A3A3]"><Braces size={12} /> Digital systems</div>
            <div className="absolute bottom-[8%] right-0 flex items-center gap-2 border border-[#292929] bg-[#080808]/95 px-3 py-2 font-mono text-[8px] uppercase tracking-[.16em] text-[#A3A3A3]"><Plane size={12} /> Aviation discipline</div>
            <span className="absolute right-[18%] top-[8%] font-mono text-[8px] uppercase tracking-[.2em] text-[#666666]">India / IN</span>
          </div>
        </header>

        <section aria-labelledby="disciplines-title" className="py-16 sm:py-24">
          <div className="mb-10 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div><p className="font-mono text-[9px] uppercase tracking-[.28em] text-[#858585]">01 / Dual discipline</p><h2 id="disciplines-title" className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">Software thinking.<br /><span className="text-[#686868]">Aviation standards.</span></h2></div>
            <p className="max-w-sm text-sm leading-7 text-[#858585]">Two technical fields connected by one operating principle: details matter when people rely on the result.</p>
          </div>
          <div className="grid gap-px border border-[#1F1F1F] bg-[#1F1F1F] lg:grid-cols-2">
            <article className="about-card group relative overflow-hidden bg-[#080808] p-6 sm:p-9">
              <div className="flex items-start justify-between"><span className="grid size-11 place-items-center border border-[#292929] bg-black"><Braces size={19} /></span><span className="font-mono text-[9px] tracking-[.22em] text-[#666666]">DIGITAL / 01</span></div>
              <p className="mt-16 font-mono text-[9px] uppercase tracking-[.24em] text-[#858585]">Independent developer</p>
              <h3 className="mt-3 text-2xl font-semibold">Systems that stay useful.</h3>
              <p className="mt-5 max-w-xl text-sm leading-7 text-[#A3A3A3]">Full-stack interfaces, APIs, network utilities, automation, authentication, and privacy-conscious product design—built to remain dependable without unnecessary noise.</p>
              <div className="mt-8 flex flex-wrap gap-2 font-mono text-[8px] uppercase tracking-[.14em] text-[#BCBCBC]">{['Next.js', 'React', 'TypeScript', 'APIs', 'Cloud'].map((item) => <span key={item} className="border border-[#292929] bg-black px-3 py-2">{item}</span>)}</div>
            </article>
            <article className="about-card group relative overflow-hidden bg-[#080808] p-6 sm:p-9">
              <div className="flex items-start justify-between"><span className="grid size-11 place-items-center border border-[#292929] bg-black"><Plane size={19} /></span><span className="font-mono text-[9px] tracking-[.22em] text-[#666666]">AVIATION / 02</span></div>
              <p className="mt-16 font-mono text-[9px] uppercase tracking-[.24em] text-[#858585]">Aircraft maintenance engineer</p>
              <h3 className="mt-3 text-2xl font-semibold">Precision beyond the screen.</h3>
              <p className="mt-5 max-w-xl text-sm leading-7 text-[#A3A3A3]">Aircraft maintenance reinforces a disciplined approach: follow evidence, respect procedure, document the work, and verify the result. Those habits carry directly into software and security.</p>
              <div className="mt-8 flex flex-wrap gap-2 font-mono text-[8px] uppercase tracking-[.14em] text-[#BCBCBC]">{['Procedure', 'Inspection', 'Traceability', 'Safety', 'Reliability'].map((item) => <span key={item} className="border border-[#292929] bg-black px-3 py-2">{item}</span>)}</div>
            </article>
          </div>
        </section>

        <section aria-labelledby="principles-title" className="border-y border-[#1F1F1F] py-16 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr]">
            <div><p className="font-mono text-[9px] uppercase tracking-[.28em] text-[#858585]">02 / Operating system</p><h2 id="principles-title" className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">The standard<br />behind the work.</h2></div>
            <div className="divide-y divide-[#1F1F1F] border-y border-[#1F1F1F]">
              {principles.map((principle) => (
                <article key={principle.number} className="about-principle group grid gap-4 py-6 sm:grid-cols-[3rem_1fr_1.4fr] sm:items-start sm:gap-6">
                  <p className="font-mono text-[9px] tracking-[.2em] text-[#666666]">{principle.number}</p>
                  <h3 className="flex items-center gap-3 text-xl font-semibold"><ShieldCheck size={16} className="text-[#BCBCBC]" />{principle.title}</h3>
                  <p className="text-sm leading-7 text-[#A3A3A3]">{principle.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div><p className="font-mono text-[9px] uppercase tracking-[.28em] text-[#858585]">03 / Signal</p><h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">Follow the work.<br /><span className="text-[#686868]">Start a conversation.</span></h2></div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <a href="https://github.com/aviorxt" target="_blank" rel="noreferrer" className="about-social group inline-flex min-h-12 items-center justify-between gap-8 border border-[#292929] bg-[#080808] px-5 font-mono text-[9px] uppercase tracking-[.16em]"><span className="flex items-center gap-3"><Github size={15} /> github.com/aviorxt</span><ArrowUpRight size={14} /></a>
              <a href="https://www.instagram.com/aviorxt/" target="_blank" rel="noreferrer" className="about-social group inline-flex min-h-12 items-center justify-between gap-8 border border-[#292929] bg-[#080808] px-5 font-mono text-[9px] uppercase tracking-[.16em]"><span className="flex items-center gap-3"><Instagram size={15} /> @aviorxt</span><ArrowUpRight size={14} /></a>
            </div>
          </div>
          <div className="about-cta relative mt-14 overflow-hidden border border-[#292929] bg-[#080808] p-6 sm:p-10">
            <div className="relative flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-mono text-[9px] uppercase tracking-[.24em] text-[#858585]">Open channel / Available online</p><h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Have a system worth building?</h2></div>
              <Link href="/contact" className="group inline-flex min-h-12 w-fit items-center gap-3 bg-white px-5 font-mono text-[9px] font-bold uppercase tracking-[.16em] text-black transition-colors hover:bg-[#DEDEDE]">Contact avrxt <ArrowUpRight size={14} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
