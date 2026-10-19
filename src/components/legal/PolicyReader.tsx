'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Children, isValidElement, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { PolicyNavItem } from '@/components/legal/PolicyShell';

type SectionElement = React.ReactElement<{ id?: string }>;

export function PolicyReader({ nav, children }: { nav: PolicyNavItem[]; children: ReactNode }) {
  const sections = useMemo(() => Children.toArray(children).filter(isValidElement) as SectionElement[], [children]);
  const [activeId, setActiveId] = useState(nav[0]?.id ?? '');
  const activeIndex = Math.max(0, nav.findIndex((item) => item.id === activeId));
  const activeSection = sections.find((section) => section.props.id === activeId) ?? sections[0];
  const progress = nav.length ? ((activeIndex + 1) / nav.length) * 100 : 0;

  useEffect(() => {
    const fromHash = window.location.hash.slice(1);
    if (nav.some((item) => item.id === fromHash)) setActiveId(fromHash);
  }, [nav]);

  function choose(id: string) {
    setActiveId(id);
    window.history.replaceState(null, '', `#${id}`);
  }

  return <section aria-label="Policy topic reader" className="space-y-4">
    <div className="border border-[#1F1F1F] bg-black p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#666666]">Choose a topic</p>
          <p className="mt-2 text-sm leading-6 text-[#A3A3A3]">Read one section at a time. Your selection is saved in the page link.</p>
        </div>
        <label className="grid gap-2 text-xs text-[#A3A3A3] sm:w-72">
          <span className="sr-only">Policy topic</span>
          <select value={activeId} onChange={(event) => choose(event.target.value)} className="min-h-11 w-full appearance-none border border-[#292929] bg-[#080808] px-3 text-sm text-white outline-none transition-colors focus:border-[#858585]">
            {nav.map((item, index) => <option key={item.id} value={item.id}>{String(index + 1).padStart(2, '0')} — {item.label}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between font-mono text-[9px] uppercase tracking-[.16em] text-[#666666]"><span>Reading progress</span><span>{activeIndex + 1} / {nav.length}</span></div>
        <div role="progressbar" aria-label="Policy section progress" aria-valuemin={1} aria-valuemax={nav.length} aria-valuenow={activeIndex + 1} className="h-1.5 overflow-hidden bg-[#1F1F1F]"><div className="h-full bg-white transition-[width] duration-300" style={{ width: `${progress}%` }} /></div>
      </div>
    </div>

    {activeSection}

    <div className="flex items-center justify-between gap-3 border border-[#1F1F1F] bg-[#080808] p-3">
      <button type="button" onClick={() => choose(nav[Math.max(0, activeIndex - 1)]?.id)} disabled={activeIndex === 0} className="inline-flex min-h-10 items-center gap-2 border border-[#292929] px-3 font-mono text-[9px] uppercase tracking-[.14em] text-[#A3A3A3] transition-colors hover:border-[#686868] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"><ChevronLeft size={14} /> Previous</button>
      <p className="hidden text-center text-xs text-[#858585] sm:block">{nav[activeIndex]?.label}</p>
      <button type="button" onClick={() => choose(nav[Math.min(nav.length - 1, activeIndex + 1)]?.id)} disabled={activeIndex === nav.length - 1} className="inline-flex min-h-10 items-center gap-2 border border-[#292929] px-3 font-mono text-[9px] uppercase tracking-[.14em] text-[#A3A3A3] transition-colors hover:border-[#686868] hover:text-white disabled:cursor-not-allowed disabled:opacity-35">Next <ChevronRight size={14} /></button>
    </div>
  </section>;
}
