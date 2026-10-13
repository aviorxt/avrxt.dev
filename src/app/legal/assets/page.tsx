import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Copyright, FileImage, ShieldCheck } from 'lucide-react';
import { buildPageMetadata } from '@/lib/page-metadata';
import logoMetadata from './logo-metadata.json';

export const metadata = buildPageMetadata({
  title: 'Brand Assets & Logo Rights',
  description: 'Official AVRXT.DEV logo variants, monochrome color references, ownership notice, and permitted-use terms.',
  keywords: ['AVRXT logo', 'AVRXT.DEV brand assets', 'aviorxt logo', 'logo copyright', 'brand usage'],
  path: '/legal/assets',
});

const logos = [
  {
    name: 'Absolute Black',
    code: 'AVRXT / MARK-01',
    file: '/assets/logo/avrxt-absolute-black.png',
    color: '#000000',
    surface: '#F7F7F7',
    border: '#D0D0D0',
    description: 'Single-color black master for pale and white surfaces.',
  },
  {
    name: 'Pure White',
    code: 'AVRXT / MARK-02',
    file: '/assets/logo/avrxt-pure-white.png',
    color: '#FFFFFF',
    surface: '#000000',
    border: '#292929',
    description: 'High-contrast white master for black and near-black surfaces.',
  },
  {
    name: 'Graphite Spectrum',
    code: 'AVRXT / MARK-03',
    file: '/assets/logo/avrxt-graphite-spectrum.png',
    color: '#A3A3A3',
    surface: '#080808',
    border: '#333333',
    description: 'Primary tonal treatment built entirely from the AVRXT neutral palette.',
  },
  {
    name: 'Terminal Stack',
    code: 'AVRXT / MARK-04',
    file: '/assets/logo/avrxt-terminal-stack.png',
    color: '#FFFFFF',
    surface: '#000000',
    border: '#292929',
    description: 'A compact avr / xt composition with rounded strokes and angular terminals.',
  },
  {
    name: 'Vector Slash',
    code: 'AVRXT / MARK-05',
    file: '/assets/logo/avrxt-vector-slash.png',
    color: '#FFFFFF',
    surface: '#000000',
    border: '#292929',
    description: 'A two-line av / rxt mark with a sharp diagonal cut through the X.',
  },
  {
    name: 'Nexus Ligature',
    code: 'AVRXT / MARK-06',
    file: '/assets/logo/avrxt-nexus-ligature.png',
    color: '#FFFFFF',
    surface: '#000000',
    border: '#292929',
    description: 'An interlocked V and X connect the stacked letterforms. The selected site favicon design.',
  },
] as const;

const palette = [
  '#000000', '#080808', '#121212', '#1F1F1F', '#292929', '#333333', '#484848', '#666666',
  '#686868', '#858585', '#A3A3A3', '#BCBCBC', '#D0D0D0', '#DEDEDE', '#E5E5E5', '#F7F7F7', '#FFFFFF',
];

function LogoCard({ logo, index }: { logo: (typeof logos)[number]; index: number }) {
  const details = logoMetadata[logo.file];
  const fileSize = details.bytes >= 1_000_000
    ? `${(details.bytes / 1_000_000).toFixed(2)} MB`
    : `${(details.bytes / 1_000).toFixed(1)} kB`;
  return (
    <article className="group overflow-hidden border border-[#1F1F1F] bg-[#080808] transition-colors hover:border-[#484848]">
      <div
        className="relative grid min-h-64 place-items-center overflow-hidden p-7 sm:min-h-72 sm:p-10"
        style={{ backgroundColor: logo.surface }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[.14] [background-image:linear-gradient(to_right,#858585_1px,transparent_1px),linear-gradient(to_bottom,#858585_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="relative w-full max-w-xl transition-transform duration-500 motion-reduce:transition-none group-hover:scale-[1.015] motion-reduce:group-hover:scale-100" style={{ aspectRatio: `${details.width} / ${details.height}` }}>
          <Image src={logo.file} alt={`${logo.name} AVRXT wordmark`} fill sizes="(max-width: 768px) 92vw, 560px" className="object-contain" priority={index === 0} />
        </div>
      </div>
      <div className="border-t p-5 sm:p-6" style={{ borderColor: logo.border }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[.2em] text-[#666666]">{logo.code}</p>
            <h2 className="mt-2 font-outfit text-2xl font-semibold tracking-[-.04em] text-white">{logo.name}</h2>
          </div>
          <span className="inline-flex items-center gap-2 border border-[#292929] bg-black px-3 py-2 font-mono text-[8px] uppercase tracking-[.14em] text-[#A3A3A3]">
            <span className="size-2 border border-white/20" style={{ backgroundColor: logo.color }} />{logo.color}
          </span>
        </div>
        <p className="mt-4 max-w-xl text-sm leading-6 text-[#858585]">{logo.description}</p>
        <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-[#292929] pt-5 font-mono text-[10px] sm:grid-cols-4">
          <div><dt className="text-[#666666]">Registered</dt><dd className="mt-1 text-[#BCBCBC]"><time dateTime={details.registered}>14 Oct 2026</time></dd></div>
          <div><dt className="text-[#666666]">Dimensions</dt><dd className="mt-1 text-[#BCBCBC]">{details.width} × {details.height} px</dd></div>
          <div><dt className="text-[#666666]">Format</dt><dd className="mt-1 text-[#BCBCBC]">{details.format}</dd></div>
          <div><dt className="text-[#666666]">File size</dt><dd className="mt-1 text-[#BCBCBC]">{fileSize}</dd></div>
        </dl>
        <details className="mt-4 font-mono text-[10px] text-[#858585]">
          <summary className="cursor-pointer py-2 transition-colors hover:text-white">File integrity / SHA-256</summary>
          <p className="mt-2 break-all leading-5">{details.sha256}</p>
        </details>
        <a href={logo.file} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex max-w-full items-center gap-2 break-all font-mono text-[9px] leading-5 text-[#858585] underline-offset-4 hover:text-white hover:underline"><FileImage size={11} className="shrink-0" />{logo.file}<ArrowUpRight size={11} className="shrink-0" /></a>
      </div>
    </article>
  );
}

export default function BrandAssetsPage() {
  const year = new Date().getFullYear();

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-4 pb-24 pt-28 text-white sm:px-6 sm:pb-32 sm:pt-36">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(circle_at_50%_-10%,rgba(255,255,255,.11),transparent_52%)]" />
      <div className="relative mx-auto max-w-6xl">
        <header className="border-b border-[#1F1F1F] pb-12 sm:pb-16">
          <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-[8px] uppercase tracking-[.22em] text-[#666666]">
            <span>/legal/assets</span>
            <span className="inline-flex items-center gap-2"><ShieldCheck size={12} /> Official asset registry / v1.1</span>
          </div>
          <div className="mt-9 grid gap-8 lg:grid-cols-[1fr_.55fr] lg:items-end">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[.28em] text-[#858585]">Identity system / monochrome masters</p>
              <h1 className="mt-5 font-outfit text-[clamp(3.8rem,10vw,8.5rem)] font-semibold uppercase leading-[.78] tracking-[-.075em]">Brand<br /><span className="text-[#686868]">assets.</span></h1>
            </div>
            <p className="border-l border-[#333333] pl-5 text-sm leading-7 text-[#A3A3A3]">The official AVRXT wordmark translated into the site’s black, white, and graphite palette. Display on this page is for identification and reference only.</p>
          </div>
        </header>

        <section aria-labelledby="logo-library-heading" className="py-12 sm:py-16">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div><p className="font-mono text-[8px] uppercase tracking-[.22em] text-[#666666]">01 / Registered set</p><h2 id="logo-library-heading" className="mt-2 text-3xl font-semibold sm:text-4xl">Logo library</h2></div>
            <p className="font-mono text-[8px] uppercase tracking-[.16em] text-[#666666]">{logos.length} controlled variants</p>
          </div>
          <div className="grid gap-4">{logos.map((logo, index) => <LogoCard key={logo.file} logo={logo} index={index} />)}</div>
        </section>

        <section aria-labelledby="palette-heading" className="border-y border-[#1F1F1F] py-12 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-[.55fr_1fr]">
            <div><p className="font-mono text-[8px] uppercase tracking-[.22em] text-[#666666]">02 / Color system</p><h2 id="palette-heading" className="mt-2 text-3xl font-semibold sm:text-4xl">Core neutrals</h2><p className="mt-5 max-w-sm text-sm leading-7 text-[#858585]">The graphite mark may use only this neutral scale. Colored, neon, or brand-altering derivatives are not official AVRXT assets.</p></div>
            <div className="grid grid-cols-3 border-l border-t border-[#292929] sm:grid-cols-6">
              {palette.map((color) => <div key={color} className="border-b border-r border-[#292929] p-2"><div className="aspect-square border border-white/10" style={{ backgroundColor: color }} /><p className="mt-2 text-center font-mono text-[7px] uppercase tracking-[.08em] text-[#858585]">{color}</p></div>)}
            </div>
          </div>
        </section>

        <section aria-labelledby="rights-heading" className="py-12 sm:py-16">
          <div className="grid gap-px border border-[#292929] bg-[#292929] lg:grid-cols-[.7fr_1.3fr]">
            <div className="bg-[#080808] p-6 sm:p-8"><Copyright className="text-[#D0D0D0]" size={24} /><p className="mt-8 font-mono text-[8px] uppercase tracking-[.22em] text-[#666666]">03 / Rights notice</p><h2 id="rights-heading" className="mt-3 text-3xl font-semibold">All rights reserved.</h2><p className="mt-4 font-mono text-[9px] uppercase leading-5 tracking-[.12em] text-[#858585]">© 2024–{year} AVRXT.DEV</p></div>
            <div className="bg-black p-6 sm:p-8">
              <div className="space-y-5 text-sm leading-7 text-[#A3A3A3]">
                <p>The AVRXT wordmark, its distinctive letterforms, lightning-shaped X, approved color treatments, and associated visual identity are proprietary brand assets of the individual operator of AVRXT.DEV. Publishing them here does not place them in the public domain or grant an open-source, commercial, or personal-use license.</p>
                <p>Unless written permission is provided, you may not copy, redraw, modify, recolor, animate, sell, license, register, use as an account identity, place on merchandise, imply endorsement, or use these assets in a way that could cause confusion with AVRXT.DEV or aviorxt.</p>
                <p>Nothing on this page claims a registered trademark where none has been registered, and nothing limits uses that applicable law independently permits, such as fair use or accurate editorial reference. Any permitted reference must remain truthful, minimal, and must not imply sponsorship or affiliation.</p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="mailto:support@avrxt.dev?subject=AVRXT%20brand%20asset%20permission" className="inline-flex min-h-11 items-center gap-2 bg-white px-5 font-mono text-[9px] font-bold uppercase tracking-[.15em] text-black transition-colors hover:bg-[#DEDEDE]">Request permission <ArrowUpRight size={12} /></a>
                <Link href="/annon/ownership" className="inline-flex min-h-11 items-center gap-2 border border-[#333333] px-5 font-mono text-[9px] uppercase tracking-[.15em] text-[#BCBCBC] transition-colors hover:border-[#686868] hover:text-white">Ownership notice <ArrowUpRight size={12} /></Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-[#1F1F1F] pt-6 font-mono text-[8px] uppercase leading-5 tracking-[.14em] text-[#666666]">Dates record registration in this asset library. Dimensions, sizes, and checksums describe the original files. Asset files are published at their listed paths for site delivery and visual reference. Technical access to a file is not permission to reuse it.</footer>
      </div>
    </main>
  );
}
