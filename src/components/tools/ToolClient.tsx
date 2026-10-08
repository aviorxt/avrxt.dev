'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Copy, ExternalLink, LoaderCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { getTool, type ToolDefinition, type ToolSlug } from '@/lib/tool-catalog';

type JsonRecord = Record<string, unknown>;

function ToolFrame({ tool, children }: { tool: ToolDefinition; children: React.ReactNode }) {
  const Icon = tool.icon;
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 pb-24 pt-28 sm:px-6 sm:pt-36">
      <Link href="/tools" className="mb-9 inline-flex min-h-11 items-center gap-2 font-mono text-[10px] uppercase tracking-[.2em] text-[#858585] transition-colors hover:text-white"><ArrowLeft size={14} /> All tools</Link>
      <header className="mb-8 border-b border-[#1F1F1F] pb-8 sm:mb-10 sm:pb-10">
        <div className="mb-5 flex items-center gap-3"><span className="grid size-10 place-items-center border border-[#292929] bg-[#080808]"><Icon size={18} /></span><p className="font-mono text-[10px] uppercase tracking-[.25em] text-[#666666]">// {tool.eyebrow}</p></div>
        <h1 className="text-[clamp(2.8rem,10vw,6.5rem)] font-semibold uppercase leading-[.82] tracking-[-.065em]">{tool.title}</h1>
        <p className="mt-6 max-w-2xl text-sm leading-7 text-[#A3A3A3] sm:text-base">{tool.description}</p>
      </header>
      <section className="tool-panel border border-[#1F1F1F] bg-[#080808]/90 p-4 sm:p-7">{children}</section>
    </main>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <label className="block"><span className="mb-2 block font-mono text-[10px] uppercase tracking-[.2em] text-[#858585]">{label}</span>{children}{hint && <span className="mt-2 block text-xs leading-5 text-[#666666]">{hint}</span>}</label>;
}

const inputClass = 'min-h-12 w-full border border-[#292929] bg-black px-4 text-sm text-white outline-none transition-colors placeholder:text-[#484848] focus:border-[#BCBCBC]';
const buttonClass = 'inline-flex min-h-12 items-center justify-center gap-2 bg-[#F7F7F7] px-5 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-black transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-40';

function Result({ data, error }: { data?: unknown; error?: string }) {
  if (!data && !error) return null;
  return <div aria-live="polite" className={`mt-5 overflow-auto border p-4 font-mono text-xs leading-6 ${error ? 'border-red-400/30 bg-red-400/5 text-red-200' : 'border-[#292929] bg-black text-[#D0D0D0]'}`}>{error || <pre className="whitespace-pre-wrap break-words">{JSON.stringify(data, null, 2)}</pre>}</div>;
}

function useToolRequest() {
  const [data, setData] = useState<unknown>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const run = useCallback(async (slug: string, body?: JsonRecord, method: 'GET' | 'POST' = 'POST') => {
    setLoading(true); setError(''); setData(undefined);
    try {
      const response = await fetch(`/api/tools/${slug}`, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
      const result = await response.json().catch(() => ({ error: 'The service returned an unreadable response.' }));
      if (!response.ok) throw new Error(result.error || 'Request failed.');
      setData(result);
      return result;
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Request failed.'); }
    finally { setLoading(false); }
  }, []);
  return { data, error, loading, run, setData };
}

function WhatIsMyIp() {
  const request = useToolRequest();
  useEffect(() => { void request.run('whatismyip', undefined, 'GET'); }, [request.run]);
  return <><button className={buttonClass} onClick={() => request.run('whatismyip', undefined, 'GET')} disabled={request.loading}>{request.loading ? <LoaderCircle className="animate-spin" size={14} /> : <RefreshCw size={14} />} Refresh details</button><Result data={request.data} error={request.error} /></>;
}

function PortCheck() {
  const request = useToolRequest();
  const [host, setHost] = useState('');
  const [port, setPort] = useState('443');
  const [authorized, setAuthorized] = useState(false);
  return <form onSubmit={(event) => { event.preventDefault(); void request.run('portcheck', { host, port: Number(port), authorized }); }}>
    <div className="grid gap-4 sm:grid-cols-[1fr_10rem]"><Field label="Public host"><input className={inputClass} value={host} onChange={(e) => setHost(e.target.value)} placeholder="example.com or 1.1.1.1" required /></Field><Field label="TCP port"><input className={inputClass} type="number" min="1" max="65535" value={port} onChange={(e) => setPort(e.target.value)} required /></Field></div>
    <label className="my-5 flex cursor-pointer items-start gap-3 text-xs leading-5 text-[#A3A3A3]"><input className="mt-1 size-4 accent-white" type="checkbox" checked={authorized} onChange={(e) => setAuthorized(e.target.checked)} required /><span>I own this host or have permission to test this single port.</span></label>
    <button className={buttonClass} disabled={request.loading || !authorized}>{request.loading ? <LoaderCircle className="animate-spin" size={14} /> : <ShieldCheck size={14} />} Run guarded check</button>
    <p className="mt-4 text-xs leading-5 text-[#666666]">TCP only. UDP has no reliable generic handshake, so claiming an arbitrary UDP port is “open” would be misleading.</p><Result data={request.data} error={request.error} />
  </form>;
}

function Mailfy() {
  const request = useToolRequest(); const [email, setEmail] = useState('');
  return <form onSubmit={(e) => { e.preventDefault(); void request.run('mailfy', { email }); }}><Field label="Email address" hint="Checks syntax and domain mail routing. It does not contact the mailbox or guarantee that a person owns it."><input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" required /></Field><button className={`${buttonClass} mt-5`} disabled={request.loading}>{request.loading ? <LoaderCircle className="animate-spin" size={14} /> : <ArrowRight size={14} />} Verify domain</button><Result data={request.data} error={request.error} /></form>;
}

const dnsTypes = ['A', 'AAAA', 'CAA', 'CNAME', 'DNSKEY', 'DS', 'HTTPS', 'MX', 'NAPTR', 'NS', 'PTR', 'SOA', 'SRV', 'SVCB', 'TLSA', 'TXT'];

function DnsTool() {
  const request = useToolRequest(); const [domain, setDomain] = useState(''); const [type, setType] = useState('A'); const [includeRdap, setIncludeRdap] = useState(true);
  return <form onSubmit={(e) => { e.preventDefault(); void request.run('dns', { domain, type, includeRdap }); }}><div className="grid gap-4 sm:grid-cols-[1fr_10rem]"><Field label="Domain"><input className={inputClass} value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" required /></Field><Field label="Record type"><select className={inputClass} value={type} onChange={(e) => setType(e.target.value)}>{dnsTypes.map((item) => <option key={item}>{item}</option>)}</select></Field></div><label className="my-5 flex items-center gap-3 text-xs text-[#A3A3A3]"><input type="checkbox" className="size-4 accent-white" checked={includeRdap} onChange={(e) => setIncludeRdap(e.target.checked)} /> Include RDAP registration summary</label><button className={buttonClass} disabled={request.loading}>{request.loading ? <LoaderCircle className="animate-spin" size={14} /> : <ArrowRight size={14} />} Query records</button><Result data={request.data} error={request.error} /></form>;
}

function FontUi() {
  const request = useToolRequest(); const [fonts, setFonts] = useState<string[]>([]); const [query, setQuery] = useState(''); const [sample, setSample] = useState('Designing in the quiet.'); const [selected, setSelected] = useState('Inter');
  useEffect(() => { void request.run('fontui', undefined, 'GET').then((result) => { if (Array.isArray(result?.fonts)) setFonts(result.fonts as string[]); }); }, [request.run]);
  useEffect(() => { const id = 'fontui-preview-font'; let link = document.getElementById(id) as HTMLLinkElement | null; if (!link) { link = document.createElement('link'); link.id = id; link.rel = 'stylesheet'; document.head.appendChild(link); } link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(selected).replace(/%20/g, '+')}:wght@400;600&display=swap`; }, [selected]);
  const visible = useMemo(() => fonts.filter((font) => font.toLowerCase().includes(query.toLowerCase())).slice(0, 80), [fonts, query]);
  return <><div className="grid gap-4 sm:grid-cols-2"><Field label="Preview text"><input className={inputClass} value={sample} onChange={(e) => setSample(e.target.value.slice(0, 140))} /></Field><Field label={`Search ${fonts.length || '300+'} families`}><input className={inputClass} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search fonts" /></Field></div><div className="my-5 min-h-40 border border-[#292929] bg-black p-5 sm:p-8"><p className="break-words text-[clamp(2rem,7vw,4.5rem)] leading-tight" style={{ fontFamily: `'${selected}', sans-serif` }}>{sample || 'Type something.'}</p><p className="mt-5 font-mono text-[10px] uppercase tracking-[.2em] text-[#666666]">{selected}</p></div><div className="grid max-h-[32rem] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">{visible.map((font) => <button type="button" key={font} onClick={() => setSelected(font)} className={`flex min-h-12 items-center justify-between border px-4 text-left text-sm transition-colors ${selected === font ? 'border-white bg-white text-black' : 'border-[#292929] bg-black text-[#BCBCBC] hover:border-[#686868]'}`}><span>{font}</span>{selected === font && <Check size={14} />}</button>)}</div>{request.error && <Result error={request.error} />}</>;
}

function SpotifyPreview() {
  const [value, setValue] = useState(''); const [embed, setEmbed] = useState(''); const [error, setError] = useState('');
  const parse = () => { setError(''); try { const url = new URL(value); if (url.hostname !== 'open.spotify.com') throw new Error('Use a valid open.spotify.com link.'); const parts = url.pathname.split('/').filter(Boolean); const typeIndex = parts.findIndex((p) => ['track', 'album', 'playlist', 'artist', 'episode', 'show'].includes(p)); const type = parts[typeIndex]; const id = parts[typeIndex + 1]; if (!type || !/^[A-Za-z0-9]{10,40}$/.test(id || '')) throw new Error('This Spotify link is not supported.'); setEmbed(`https://open.spotify.com/embed/${type}/${id}`); } catch (cause) { setEmbed(''); setError(cause instanceof Error ? cause.message : 'Invalid Spotify link.'); } };
  return <><form onSubmit={(e) => { e.preventDefault(); parse(); }}><Field label="Spotify URL" hint="Playback stays inside Spotify’s official embed. This tool does not download, extract, or convert copyrighted audio."><input className={inputClass} value={value} onChange={(e) => setValue(e.target.value)} placeholder="https://open.spotify.com/track/..." required /></Field><button className={`${buttonClass} mt-5`}><MusicIcon /> Open preview</button></form>{error && <Result error={error} />}{embed && <div className="mt-6 overflow-hidden border border-[#292929] bg-black p-2"><iframe title="Spotify preview" src={embed} width="100%" height="352" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" /></div>}</>;
}

function MusicIcon() { return <span aria-hidden="true">▶</span>; }

function QuoteTool() {
  const request = useToolRequest(); const [copied, setCopied] = useState(false);
  useEffect(() => { void request.run('quote', undefined, 'GET'); }, [request.run]);
  const quote = request.data as { quote?: string; author?: string } | undefined;
  const copy = async () => { if (!quote?.quote) return; await navigator.clipboard.writeText(`“${quote.quote}” — ${quote.author || 'Unknown'}`); setCopied(true); window.setTimeout(() => setCopied(false), 1600); };
  return <div><div className="min-h-56 border border-[#292929] bg-black p-6 sm:p-10">{request.loading ? <LoaderCircle className="animate-spin text-[#858585]" /> : <><blockquote className="text-[clamp(1.7rem,5vw,3.5rem)] font-medium leading-[1.08] tracking-[-.04em] text-[#F7F7F7]">{quote?.quote ? `“${quote.quote}”` : 'No signal yet.'}</blockquote>{quote?.author && <p className="mt-6 font-mono text-[10px] uppercase tracking-[.25em] text-[#858585]">— {quote.author}</p>}</>}</div><div className="mt-4 flex flex-wrap gap-3"><button className={buttonClass} onClick={() => request.run('quote', undefined, 'GET')} disabled={request.loading}><RefreshCw size={14} /> Another quote</button><button className={`${buttonClass} border border-[#292929] !bg-black !text-white`} onClick={copy} disabled={!quote?.quote}>{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}</button><a className={`${buttonClass} border border-[#292929] !bg-black !text-white`} href="https://dummyjson.com/docs/quotes" target="_blank" rel="noreferrer">Source <ExternalLink size={13} /></a></div><Result error={request.error} /></div>;
}

const views: Record<ToolSlug, React.ComponentType> = { whatismyip: WhatIsMyIp, portcheck: PortCheck, mailfy: Mailfy, dns: DnsTool, fontui: FontUi, spotmp3: SpotifyPreview, quote: QuoteTool };

export default function ToolClient({ slug }: { slug: ToolSlug }) {
  const tool = getTool(slug);
  if (!tool) return null;
  const View = views[tool.slug];
  return <ToolFrame tool={tool}><View /></ToolFrame>;
}
