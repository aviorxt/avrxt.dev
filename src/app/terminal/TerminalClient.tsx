'use client';

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Command, CornerDownLeft, Terminal, Trash2 } from 'lucide-react';
import { COMMAND_LIMIT, runTerminalCommand, terminalCompletions, type TerminalPage, type TerminalResult } from '@/lib/terminal';

type Entry = { id: number; command?: string; result: TerminalResult };
const welcome: Entry = { id: 0, result: { text: 'Welcome to AVRXT.\nA small command line for a wide-open website.\n\nType help to get started, or choose a command below.' } };

export default function TerminalClient({ pages }: { pages: TerminalPage[] }) {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [entries, setEntries] = useState<Entry[]>([welcome]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [announcement, setAnnouncement] = useState('');
  const field = useRef<HTMLInputElement>(null);
  const output = useRef<HTMLDivElement>(null);
  const counter = useRef(1);
  const draft = useRef('');
  const suggestions = input.trim() ? terminalCompletions(input, pages).slice(0, 4) : [];

  useEffect(() => { if (output.current) output.current.scrollTop = output.current.scrollHeight; }, [entries]);

  function clear() {
    setEntries([]); setHistory([]); setInput(''); setHistoryIndex(-1); draft.current = '';
    setAnnouncement('Output and command history cleared.'); field.current?.focus();
  }

  function execute(value: string) {
    if (!value.trim()) return;
    const result = runTerminalCommand(value, pages);
    if (result.clear) { clear(); return; }
    if (result.history) result.text = history.length ? history.map((item, index) => `${String(index + 1).padStart(2, '0')}  ${item}`).join('\n') : 'No previous commands in this tab.';
    setEntries(previous => [...previous.slice(-39), { id: counter.current++, command: value.slice(0, COMMAND_LIMIT), result }]);
    setHistory(previous => [...previous.slice(-49), value.slice(0, COMMAND_LIMIT)]);
    setInput(''); setHistoryIndex(-1); draft.current = ''; setAnnouncement(''); field.current?.focus();
    if (result.navigate) {
      // Navigation can only come from the trusted public-page catalog.
      if (result.navigate === 'https://status.avrxt.dev') window.location.assign(result.navigate);
      else router.push(result.navigate);
    }
  }

  function submit(event: FormEvent) { event.preventDefault(); execute(input); }
  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'l') { event.preventDefault(); clear(); }
    else if (event.key === 'ArrowUp' && history.length) {
      event.preventDefault(); if (historyIndex === -1) draft.current = input;
      const next = Math.min(historyIndex + 1, history.length - 1); setHistoryIndex(next); setInput(history[history.length - 1 - next]);
    } else if (event.key === 'ArrowDown' && historyIndex >= 0) {
      event.preventDefault(); const next = historyIndex - 1; setHistoryIndex(next); setInput(next < 0 ? draft.current : history[history.length - 1 - next]);
    } else if (event.key === 'Tab' && !event.shiftKey) {
      const matches = terminalCompletions(input, pages);
      if (matches.length === 1) { event.preventDefault(); setInput(matches[0]); }
    }
  }

  return <main className="mx-auto max-w-6xl px-4 pb-24 pt-28 sm:px-6">
    <header className="mb-6 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
      <div><p className="mb-5 font-mono text-[10px] uppercase tracking-[.25em] text-cyan-200/60">AVRXT / INTERACTIVE INDEX / 01</p><h1 className="text-5xl font-semibold uppercase leading-[.85] tracking-[-.07em] text-white sm:text-6xl">Less clicking.<br /><span className="text-[#737373]">More exploring.</span></h1></div>
      <p className="max-w-xs text-sm leading-7 text-[#999]">The whole public website, a command away.<br />Start with <button onClick={() => execute('help')} className="font-mono text-cyan-200 underline decoration-cyan-200/30 underline-offset-4">help</button>. Follow your curiosity.</p>
    </header>

    <section aria-label="Website terminal" className="overflow-hidden rounded-xl border border-[#2b2b2b] bg-[#080a0b] shadow-[0_30px_90px_rgba(0,0,0,.35)]">
      <div className="flex items-center justify-between gap-3 border-b border-[#24282a] bg-[#101214] px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-4"><span aria-hidden="true" className="flex gap-1.5"><span className="size-2 rounded-full bg-[#676767]" /><span className="size-2 rounded-full bg-[#474747]" /><span className="size-2 rounded-full bg-cyan-300/70" /></span><span className="truncate font-mono text-[10px] text-[#a3a3a3]">guest@avrxt — /terminal</span></div>
        <span className="flex shrink-0 items-center gap-2 font-mono text-[9px] tracking-[.14em] text-cyan-200/70"><span className="size-1.5 rounded-full bg-cyan-200" />READY</span>
      </div>
      <div className="grid lg:grid-cols-[1fr_230px]">
        <div className="min-w-0">
          <div ref={output} id="terminal-output" role="log" aria-label="Terminal output" aria-live="polite" aria-relevant="additions" tabIndex={0} className="h-[min(40vh,340px)] min-h-64 overflow-y-auto overscroll-contain px-4 py-6 font-mono text-xs leading-6 focus-visible:outline focus-visible:outline-cyan-200/50 sm:px-6 sm:text-[13px]">
            {entries.length === 0 && <p className="text-[#626b70]">A fresh start. Type a command below.</p>}
            {entries.map(entry => <div key={entry.id} className="mb-6 last:mb-0">
              {entry.command && <p className="mb-2 break-words text-[#e5e5e5]"><span className="select-none text-cyan-200/75">guest@avrxt <span className="text-[#626b70]">~</span> $ </span>{entry.command}</p>}
              <p className={`whitespace-pre-wrap break-words ${entry.result.error ? 'text-amber-200/80' : 'text-[#aab2b7]'}`}>{entry.result.text}</p>
              {!!entry.result.pages?.length && <div className="mt-3 grid gap-1">
                {entry.result.pages.map(page => <Link key={page.href} href={page.href} prefetch={false} rel={page.external ? 'noopener noreferrer' : undefined} target={page.external ? '_blank' : undefined} className="group flex min-h-12 items-start justify-between gap-3 rounded-md border border-transparent px-3 py-2 transition-colors hover:border-[#28383d] hover:bg-cyan-200/[.035] focus-visible:outline focus-visible:outline-cyan-200">
                  <span className="min-w-0"><span className="break-words text-cyan-200/85">{page.command}</span><span className="ml-3 text-[#d0d5d7]">{page.title}</span><span className="mt-0.5 block text-[11px] leading-5 text-[#727e85]">{page.description}</span></span><ArrowUpRight size={13} aria-hidden="true" className="mt-1 shrink-0 text-[#626b70] group-hover:text-cyan-200" />
                </Link>)}
              </div>}
            </div>)}
          </div>
          <form onSubmit={submit} className="border-t border-[#24282a] bg-[#0c0f10] px-4 py-4 sm:px-6">
            <label htmlFor="terminal-command" className="sr-only">Terminal command</label>
            <div className="flex items-center gap-2 sm:gap-3"><span aria-hidden="true" className="shrink-0 font-mono text-sm text-cyan-200">$</span><input ref={field} id="terminal-command" value={input} onChange={event => { setInput(event.target.value); setHistoryIndex(-1); }} onKeyDown={keyDown} maxLength={COMMAND_LIMIT} autoComplete="off" autoCorrect="off" spellCheck={false} aria-describedby="terminal-hint" placeholder="help, profile, open contact…" className="min-w-0 flex-1 bg-transparent py-2 font-mono text-base text-white caret-cyan-200 outline-none placeholder:text-[#515b61] sm:text-sm" /><button type="submit" aria-label="Run command" className="grid size-10 shrink-0 place-items-center rounded-md border border-[#30383c] text-[#abb6bc] transition-colors hover:border-cyan-200/50 hover:text-cyan-200 focus-visible:outline focus-visible:outline-cyan-200"><CornerDownLeft size={16} /></button></div>
            {!!suggestions.length && <div aria-label="Command suggestions" className="mt-2 flex flex-wrap gap-2">{suggestions.map(suggestion => <button key={suggestion} type="button" onClick={() => { setInput(suggestion); field.current?.focus(); }} className="rounded border border-[#242f35] px-2 py-1 font-mono text-[10px] text-[#90a3ad] hover:text-cyan-200">{suggestion}</button>)}</div>}
          </form>
        </div>
        <aside className="border-t border-[#24282a] px-5 py-6 lg:border-l lg:border-t-0">
          <div className="mb-5 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.2em] text-[#758087]"><Terminal size={13} />Quick commands</div>
          <div className="grid grid-cols-2 gap-2">{['help', 'profile', 'contact', 'pages', 'tools', 'docs', 'privacy', 'security'].map(command => <button type="button" key={command} onClick={() => execute(command)} className="flex min-h-10 items-center justify-between rounded-md border border-[#232a2e] px-3 py-2 text-left font-mono text-[11px] text-[#aab6bd] transition-colors hover:border-cyan-200/40 hover:text-cyan-200 focus-visible:outline focus-visible:outline-cyan-200"><span>{command}</span><span aria-hidden="true" className="text-[#4c575e]">↵</span></button>)}</div>
          <div className="mt-6 flex items-center justify-between border-t border-[#24282a] pt-4"><span className="font-mono text-[9px] text-[#65737b]">{pages.length} destinations</span><button type="button" onClick={clear} aria-label="Clear terminal and history" className="grid size-9 place-items-center rounded text-[#758087] hover:text-white focus-visible:outline focus-visible:outline-cyan-200"><Trash2 size={14} /></button></div>
        </aside>
      </div>
      <div id="terminal-hint" className="flex flex-wrap items-center justify-between gap-2 border-t border-[#24282a] px-4 py-3 font-mono text-[9px] leading-5 text-[#69777f] sm:px-6"><span className="flex items-center gap-2"><Command size={11} />↑ ↓ history · Tab complete · Ctrl+L clear</span><span>Commands stay in this tab. Nothing runs on a server.</span></div>
    </section>
    <p role="status" className="sr-only">{announcement}</p>
    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[9px] uppercase tracking-[.12em] text-[#666]"><span>Public pages only</span><span>No stored command history</span><Link href="/legal/privacy#tools" className="underline underline-offset-4 hover:text-white">Privacy details</Link></div>
  </main>;
}
