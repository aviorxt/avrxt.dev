'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { Search, X, ArrowUpRight, LoaderCircle } from 'lucide-react';
import { fetchSearch, localSearch, SEARCH_QUERY_LIMIT, type SearchRecord } from '@/lib/site-search';

const config = { appId: process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '', index: process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || '', key: process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || '' };

export default function SiteSearch({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [state, setState] = useState<{ query: string; hits: SearchRecord[]; status: 'ready' | 'loading' | 'fallback' }>({ query: '', hits: localSearch(''), status: 'ready' });
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const results = useRef<HTMLDivElement>(null);
  const cache = useRef(new Map<string, { expires: number; hits: SearchRecord[] }>());
  const normalized = query.trim();
  const current = normalized === state.query;
  const hits = current ? state.hits : localSearch(normalized);
  const selected = Math.min(active, Math.max(0, hits.length - 1));
  const status = !current && normalized.length >= 2 ? 'loading' : state.status;

  useEffect(() => {
    const previous = document.activeElement;
    input.current?.focus();
    return () => { if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, []);
  useEffect(() => {
    if (normalized.length < 2) return;
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout>;
    const debounce = setTimeout(async () => {
      const cached = cache.current.get(normalized.toLowerCase());
      if (cached && cached.expires > Date.now()) { setState({ query: normalized, hits: cached.hits, status: 'ready' }); return; }
      timeout = setTimeout(() => controller.abort(), 4000);
      try {
        const found = await fetchSearch(normalized, config, controller.signal);
        if (controller.signal.aborted) return;
        if (cache.current.size >= 20) cache.current.delete(cache.current.keys().next().value!);
        cache.current.set(normalized.toLowerCase(), { expires: Date.now() + 30_000, hits: found });
        setState({ query: normalized, hits: found, status: 'ready' });
      } catch {
        // Cleanup aborts are ignored; deadline aborts display local navigation.
        if (!cancelled) setState({ query: normalized, hits: localSearch(normalized), status: 'fallback' });
      } finally { clearTimeout(timeout); }
    }, 300);
    let cancelled = false;
    return () => { cancelled = true; clearTimeout(debounce); clearTimeout(timeout); controller.abort(); };
  }, [normalized]);
  useEffect(() => { results.current?.querySelector(`[data-result="${selected}"]`)?.scrollIntoView({ block: 'nearest' }); }, [selected]);

  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') { event.preventDefault(); onClose(); }
    if (event.target === input.current && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault(); setActive(index => hits.length ? (index + (event.key === 'ArrowDown' ? 1 : -1) + hits.length) % hits.length : 0);
    }
    if (event.target === input.current && event.key === 'Enter' && hits[selected]) {
      event.preventDefault(); (results.current?.querySelector(`[data-result="${selected}"]`) as HTMLAnchorElement | null)?.click();
    }
    if (event.key === 'Tab') {
      const focusable = Array.from(dialog.current?.querySelectorAll<HTMLElement>('input,button,a[href]') || []);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }
  return <div className="fixed inset-0 z-[350] flex items-start justify-center px-3 pt-[max(2rem,env(safe-area-inset-top))] sm:px-6 sm:pt-[15vh]">
    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} aria-hidden="true" />
    <div ref={dialog} role="dialog" aria-modal="true" aria-label="Search AVRXT" onKeyDown={keyboard} className="v7-search relative flex max-h-[calc(100dvh-4rem)] w-full max-w-2xl flex-col overflow-hidden border border-white/15 bg-[#080808] shadow-[0_0_100px_black]">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3 sm:p-5">
        <Search className="h-5 w-5 shrink-0 text-cyan-300" aria-hidden="true" />
        <input ref={input} value={query} maxLength={SEARCH_QUERY_LIMIT} onChange={event => { const value = event.target.value; setQuery(value); setActive(0); if (value.trim().length < 2) setState({ query: value.trim(), hits: localSearch(value), status: 'ready' }); }} placeholder="Search pages, tools, and notes…" aria-label="Search pages, tools, and notes" role="combobox" aria-autocomplete="list" aria-expanded="true" aria-controls="site-search-results" aria-activedescendant={hits[selected] ? `search-result-${selected}` : undefined} className="min-w-0 flex-1 bg-transparent font-mono text-base text-white outline-none placeholder:text-zinc-600" />
        <button onClick={onClose} aria-label="Close site search" className="flex h-11 w-11 shrink-0 items-center justify-center text-zinc-400 hover:text-white focus-visible:outline-cyan-300"><X size={18} /></button>
      </div>
      <div role="status" aria-live="polite" className="flex min-h-10 items-center gap-2 px-5 font-mono text-[10px] uppercase tracking-widest text-zinc-500">{status === 'loading' ? <><LoaderCircle size={12} className="animate-spin" /> Searching…</> : status === 'fallback' ? 'Page shortcuts · note search temporarily unavailable' : normalized.length < 2 ? 'Explore public pages · type 2 characters to search notes' : `${hits.length} results`}</div>
      <div ref={results} id="site-search-results" role="listbox" aria-label="Search results" className="min-h-0 overflow-y-auto overscroll-contain px-2 pb-3 custom-scrollbar">
        {hits.map((hit, index) => <Link key={hit.href} id={`search-result-${index}`} data-result={index} role="option" aria-selected={selected === index} href={hit.href} prefetch={false} onFocus={() => setActive(index)} onMouseEnter={() => setActive(index)} onClick={onClose} className={`group flex items-center gap-4 border-l-2 px-4 py-3 transition-colors ${selected === index ? 'border-cyan-300 bg-cyan-300/[0.06]' : 'border-transparent hover:bg-white/[0.03]'}`}>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-3 gap-y-1"><span className="text-sm font-semibold text-zinc-200">{hit.title}</span><span className="font-mono text-[9px] uppercase tracking-widest text-cyan-300/70">{hit.category}</span></div><p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">{hit.description}</p><p className="mt-1 truncate font-mono text-[10px] text-zinc-600">{hit.href}</p></div><ArrowUpRight size={16} className="shrink-0 text-zinc-600" aria-hidden="true" />
        </Link>)}
        {hits.length === 0 && status !== 'loading' && <p className="p-10 text-center text-sm text-zinc-500">No matches. Try a page name or a different phrase.</p>}
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-white/10 px-5 py-3 font-mono text-[10px] text-zinc-600"><span>↑ ↓ navigate · Enter open · Esc close</span><a href="https://www.algolia.com/" target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white">Search by Algolia</a></div>
    </div>
  </div>;
}
