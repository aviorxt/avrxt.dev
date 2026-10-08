import Link from 'next/link';
import { ArrowUpRight, Wrench } from 'lucide-react';
import Reveal from '@/components/Reveal';
import { tools } from '@/lib/tool-catalog';
import { buildPageMetadata } from '@/lib/page-metadata';

export const metadata = buildPageMetadata({
  title: 'Tools',
  description: 'Small, privacy-conscious network, email, DNS, typography, Spotify, and writing utilities from avrxt.dev.',
  keywords: ['developer tools', 'dns lookup', 'port checker', 'ip lookup', 'font preview'],
  path: '/tools',
});

export default function ToolsPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-24 pt-28 sm:px-6 sm:pt-36">
      <Reveal className="active">
        <header className="mb-10 max-w-3xl sm:mb-14">
          <p className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.28em] text-[#858585]"><Wrench size={13} /> // Utility layer / 07</p>
          <h1 className="text-[clamp(3.4rem,12vw,8rem)] font-semibold uppercase leading-[.78] tracking-[-.075em] text-white">Useful.<br /><span className="text-[#686868]">Quietly.</span></h1>
          <p className="mt-8 max-w-xl text-sm leading-7 text-[#A3A3A3] sm:text-base">Focused utilities with no accounts, no ad-tech, and restrained data collection. Built to match the same monochrome system as the rest of avrxt.dev.</p>
        </header>
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.slug} href={`/tools/${tool.slug}`} className="tool-card group relative min-h-64 overflow-hidden border border-[#1F1F1F] bg-[#080808] p-5 sm:p-6">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[10px] tracking-[.24em] text-[#666666]">0{index + 1}</span>
                  <Icon size={18} className="text-[#858585] transition-all duration-300 group-hover:rotate-6 group-hover:text-white" />
                </div>
                <div className="absolute inset-x-5 bottom-5 sm:inset-x-6 sm:bottom-6">
                  <p className="mb-2 font-mono text-[9px] uppercase tracking-[.22em] text-[#666666]">{tool.eyebrow}</p>
                  <h2 className="mb-3 text-2xl font-semibold text-[#F7F7F7]">{tool.title}</h2>
                  <p className="max-w-sm text-xs leading-6 text-[#858585]">{tool.description}</p>
                </div>
                <ArrowUpRight size={16} className="absolute bottom-6 right-6 translate-y-2 text-white opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100" />
              </Link>
            );
          })}
        </section>
      </Reveal>
    </main>
  );
}
