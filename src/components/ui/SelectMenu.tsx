'use client';

import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export type SelectMenuOption = { value: string; label: string; description?: string };

export function SelectMenu({ value, options, onValueChange, label, className = '' }: { value: string; options: SelectMenuOption[]; onValueChange: (value: string) => void; label: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    const close = (event: MouseEvent) => { if (root.current && !root.current.contains(event.target as Node)) setOpen(false); };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, []);

  return <div ref={root} className={`relative ${className}`}>
    <button type="button" aria-label={label} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-white/15 bg-[#090909] px-3 text-left text-sm text-white outline-none transition hover:border-white/30 focus:border-white/45 focus:ring-2 focus:ring-white/10">
      <span className="min-w-0 truncate">{selected?.label ?? 'Select an option'}</span><ChevronDown size={16} className={`shrink-0 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`}/>
    </button>
    {open && <div role="listbox" aria-label={label} className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-50 max-h-64 overflow-auto rounded-lg border border-white/15 bg-[#101010] p-1 shadow-2xl shadow-black/70">
      {options.map((option) => <button key={option.value} type="button" role="option" aria-selected={option.value === value} onClick={() => { onValueChange(option.value); setOpen(false); }} className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition ${option.value === value ? 'bg-white text-black' : 'text-zinc-300 hover:bg-white/10 hover:text-white'}`}><span className="min-w-0"><span className="block truncate">{option.label}</span>{option.description && <span className={`mt-0.5 block truncate text-xs ${option.value === value ? 'text-black/65' : 'text-zinc-500'}`}>{option.description}</span>}</span>{option.value === value && <Check size={15} className="shrink-0"/>}</button>)}
    </div>}
  </div>;
}
