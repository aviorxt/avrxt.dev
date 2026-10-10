'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Building2, Check, ChevronDown, CircleCheck, CircleX, Clock3, Copy, Database, ExternalLink, Globe2, Hash, LoaderCircle, MailCheck, MapPin, MonitorSmartphone, Network, Radio, RefreshCw, Search, Server, ShieldCheck, Wifi } from 'lucide-react';
import { getTool, type ToolDefinition, type ToolSlug } from '@/lib/tool-catalog';
import KeyboardTester from '@/components/tools/KeyboardTester';

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

const inputClass = 'min-h-12 w-full border border-[#292929] bg-black px-4 text-sm text-white outline-none transition-all placeholder:text-[#484848] focus:border-[#BCBCBC] focus:bg-[#080808]';
const buttonClass = 'inline-flex min-h-12 items-center justify-center gap-2 bg-[#F7F7F7] px-5 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0';

function Result({ error }: { error?: string }) {
  if (!error) return null;
  return <div aria-live="polite" className="mt-5 flex items-start gap-3 border border-red-400/30 bg-red-400/5 p-4 text-sm leading-6 text-red-100"><CircleX className="mt-0.5 shrink-0" size={17} /><div><p className="font-medium">Request could not be completed</p><p className="mt-1 text-xs text-red-200/70">{error}</p></div></div>;
}

function LoadingPanel({ label }: { label: string }) {
  return <div className="mt-5 grid min-h-36 place-items-center border border-[#292929] bg-black"><div className="text-center"><LoaderCircle className="mx-auto animate-spin text-[#BCBCBC]" size={22} /><p className="mt-4 font-mono text-[9px] uppercase tracking-[.22em] text-[#666666]">{label}</p></div></div>;
}

function Toggle({ checked, onChange, children }: { checked: boolean; onChange: (checked: boolean) => void; children: React.ReactNode }) {
  return <label className="group flex cursor-pointer items-start gap-3 text-xs leading-5 text-[#A3A3A3]"><input className="sr-only" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span aria-hidden="true" className={`mt-0.5 grid size-5 shrink-0 place-items-center border transition-all ${checked ? 'border-white bg-white text-black' : 'border-[#484848] bg-black text-transparent group-hover:border-[#858585]'}`}><Check size={13} strokeWidth={3} /></span><span>{children}</span></label>;
}

function CustomSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', escape); };
  }, []);
  return <div ref={root} className="relative"><span className="mb-2 block font-mono text-[10px] uppercase tracking-[.2em] text-[#858585]">{label}</span><button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)} className={`${inputClass} flex items-center justify-between text-left`}><span className="font-mono text-xs tracking-[.14em]">{value}</span><ChevronDown size={15} className={`text-[#858585] transition-transform duration-300 ${open ? 'rotate-180' : ''}`} /></button>{open && <div role="listbox" aria-label={label} className="absolute left-0 right-0 top-[4.5rem] z-40 grid max-h-64 grid-cols-2 gap-px overflow-y-auto border border-[#484848] bg-[#292929] p-px shadow-2xl shadow-black sm:grid-cols-1">{options.map((option) => <button key={option} type="button" role="option" aria-selected={option === value} onClick={() => { onChange(option); setOpen(false); }} className={`flex min-h-11 items-center justify-between bg-black px-3 font-mono text-[10px] tracking-[.12em] transition-colors hover:bg-[#1F1F1F] ${option === value ? 'text-white' : 'text-[#858585]'}`}><span>{option}</span>{option === value && <Check size={13} />}</button>)}</div>}</div>;
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
  const [copied, setCopied] = useState(false);
  useEffect(() => { void request.run('whatismyip', undefined, 'GET'); }, [request.run]);
  const data = request.data as {
    ip?: string; version?: string; protocol?: string; userAgent?: string; enriched?: boolean; source?: string;
    location?: { city?: string | null; region?: string | null; postalCode?: string | null; country?: string | null; countryCode?: string | null; continent?: string | null; latitude?: number | null; longitude?: number | null };
    network?: { isp?: string | null; organization?: string | null; asn?: string | null; domain?: string | null };
    timezone?: { id?: string | null; abbreviation?: string | null; utcOffset?: string | null; currentTime?: string | null };
  } | undefined;
  const copyIp = async () => { if (!data?.ip) return; await navigator.clipboard.writeText(data.ip); setCopied(true); window.setTimeout(() => setCopied(false), 1600); };
  const location = [data?.location?.city, data?.location?.region, data?.location?.country].filter(Boolean).join(', ') || 'Unavailable';
  const coordinates = data?.location?.latitude != null && data.location.longitude != null ? `${data.location.latitude.toFixed(4)}, ${data.location.longitude.toFixed(4)}` : 'Unavailable';
  const detailCards = [
    { label: 'Location', value: location, meta: data?.location?.postalCode || data?.location?.countryCode || 'Regional data unavailable', icon: MapPin },
    { label: 'Internet provider', value: data?.network?.isp || 'Unavailable', meta: data?.network?.organization || data?.network?.domain || 'Provider data unavailable', icon: Building2 },
    { label: 'Autonomous system', value: data?.network?.asn || 'Unavailable', meta: data?.network?.domain || 'ASN routing identity', icon: Network },
    { label: 'Timezone', value: data?.timezone?.id || 'Unavailable', meta: [data?.timezone?.abbreviation, data?.timezone?.utcOffset].filter(Boolean).join(' · ') || 'Timezone data unavailable', icon: Clock3 },
    { label: 'Coordinates', value: coordinates, meta: data?.location?.continent || 'Approximate IP location', icon: Globe2 },
    { label: 'Connection', value: `${data?.version || 'Unknown'} · ${(data?.protocol || 'https').toUpperCase()}`, meta: data?.source || 'Network request details', icon: Wifi },
  ];
  return <div aria-live="polite">
    {request.loading && !data ? <div className="grid min-h-64 place-items-center border border-[#292929] bg-black"><div className="text-center"><LoaderCircle className="mx-auto animate-spin text-[#BCBCBC]" size={24} /><p className="mt-4 font-mono text-[10px] uppercase tracking-[.2em] text-[#666666]">Tracing network details</p></div></div> : request.error ? <Result error={request.error} /> : data && <>
      <div className="relative overflow-hidden border border-[#292929] bg-black p-5 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-28 size-72 rounded-full bg-white/[.045] blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0"><p className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.22em] text-[#858585]"><span className={`size-1.5 rounded-full ${data.enriched ? 'bg-emerald-400' : 'bg-[#858585]'}`} /> Public IP address</p><p className="break-all font-mono text-[clamp(1.75rem,7vw,4rem)] font-semibold leading-none tracking-[-.055em] text-white">{data.ip || 'Unavailable'}</p><p className="mt-4 max-w-xl text-xs leading-5 text-[#686868]">Your approximate public network identity. Location data is IP-based and may reflect your VPN or provider gateway.</p></div>
          <button type="button" className={`${buttonClass} shrink-0 border border-[#292929] !bg-[#121212] !text-white hover:!bg-[#1F1F1F]`} onClick={copyIp} disabled={!data.ip}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Copied' : 'Copy IP'}</button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{detailCards.map(({ label, value, meta, icon: Icon }) => <article key={label} className="group min-h-40 border border-[#1F1F1F] bg-black p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#484848] hover:bg-[#0d0d0d]"><div className="mb-7 flex items-center justify-between"><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#666666]">{label}</p><Icon size={15} className="text-[#686868] transition-colors group-hover:text-white" /></div><p className="break-words text-lg font-medium tracking-[-.025em] text-[#F7F7F7]">{value}</p><p className="mt-2 break-words text-xs leading-5 text-[#686868]">{meta}</p></article>)}</div>
      <div className="mt-3 flex items-start gap-3 border border-[#1F1F1F] bg-black p-4"><MonitorSmartphone size={15} className="mt-0.5 shrink-0 text-[#686868]" /><div className="min-w-0"><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#666666]">Browser signature</p><p className="mt-2 break-words text-xs leading-5 text-[#858585]">{data.userAgent || 'Unavailable'}</p></div></div>
    </>}
    <button className={`${buttonClass} mt-5`} onClick={() => request.run('whatismyip', undefined, 'GET')} disabled={request.loading}>{request.loading ? <LoaderCircle className="animate-spin" size={14} /> : <RefreshCw size={14} />} Refresh details</button>
  </div>;
}

function PortCheck() {
  const request = useToolRequest();
  const [host, setHost] = useState('');
  const [port, setPort] = useState('443');
  const [authorized, setAuthorized] = useState(false);
  const result = request.data as { target?: string; resolvedAddress?: string; port?: number; protocol?: string; status?: string; open?: boolean; latencyMs?: number; reason?: string } | undefined;
  return <form onSubmit={(event) => { event.preventDefault(); void request.run('portcheck', { host, port: Number(port), authorized }); }}>
    <div className="mb-5 flex items-center gap-3 border border-[#1F1F1F] bg-black p-4"><span className="grid size-10 shrink-0 place-items-center border border-[#292929] bg-[#080808]"><Radio size={16} /></span><div><p className="text-sm font-medium">Single-port TCP probe</p><p className="mt-1 text-xs text-[#686868]">Secure, rate-limited, and restricted to public addresses.</p></div></div>
    <div className="grid gap-4 sm:grid-cols-[1fr_10rem]"><Field label="Public host"><input className={inputClass} value={host} onChange={(e) => setHost(e.target.value)} placeholder="example.com or 1.1.1.1" required /></Field><Field label="TCP port"><input className={inputClass} type="number" min="1" max="65535" value={port} onChange={(e) => setPort(e.target.value)} required /></Field></div>
    <div className="my-5"><Toggle checked={authorized} onChange={setAuthorized}>I own this host or have permission to test this single port.</Toggle></div>
    <button className={buttonClass} disabled={request.loading || !authorized}>{request.loading ? <LoaderCircle className="animate-spin" size={14} /> : <ShieldCheck size={14} />} Run guarded check</button>
    <p className="mt-4 text-xs leading-5 text-[#666666]">TCP only. UDP has no reliable generic handshake, so claiming an arbitrary UDP port is “open” would be misleading.</p>
    {request.loading && <LoadingPanel label="Testing remote handshake" />}<Result error={request.error} />
    {result && <div aria-live="polite" className="mt-5 overflow-hidden border border-[#292929] bg-black"><div className={`flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7 ${result.open ? 'bg-white/[.035]' : ''}`}><div className="flex items-center gap-4"><span className={`grid size-12 shrink-0 place-items-center border ${result.open ? 'border-white bg-white text-black' : 'border-[#484848] bg-[#121212] text-[#A3A3A3]'}`}>{result.open ? <CircleCheck size={22} /> : <CircleX size={22} />}</span><div><p className="font-mono text-[9px] uppercase tracking-[.22em] text-[#666666]">Port status</p><p className="mt-1 text-2xl font-semibold uppercase tracking-[-.04em]">{result.open ? 'Open' : 'Closed / filtered'}</p></div></div><div className="font-mono text-xs text-[#858585] sm:text-right"><p>{result.target}:{result.port}</p><p className="mt-1">{result.latencyMs} ms · {result.protocol}</p></div></div><div className="grid border-t border-[#1F1F1F] sm:grid-cols-2"><div className="border-b border-[#1F1F1F] p-5 sm:border-b-0 sm:border-r"><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#666666]">Resolved address</p><p className="mt-2 break-all text-sm text-[#D0D0D0]">{result.resolvedAddress}</p></div><div className="p-5"><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#666666]">Response</p><p className="mt-2 text-sm text-[#D0D0D0]">{result.reason}</p></div></div></div>}
  </form>;
}

function Mailfy() {
  const request = useToolRequest(); const [email, setEmail] = useState('');
  const result = request.data as { email?: string; domain?: string; syntaxValid?: boolean; acceptsMail?: boolean; mx?: Array<{ exchange: string; priority: number }>; verdict?: string } | undefined;
  return <form onSubmit={(e) => { e.preventDefault(); void request.run('mailfy', { email }); }}><div className="mb-5 grid gap-px border border-[#292929] bg-[#292929] sm:grid-cols-3">{['Syntax inspection', 'Domain lookup', 'MX verification'].map((step, index) => <div key={step} className="flex items-center gap-3 bg-black p-4"><span className="font-mono text-[9px] text-[#666666]">0{index + 1}</span><span className="text-xs text-[#BCBCBC]">{step}</span></div>)}</div><Field label="Email address" hint="Checks syntax and domain mail routing. It does not contact the mailbox or guarantee that a person owns it."><input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" required /></Field><button className={`${buttonClass} mt-5`} disabled={request.loading}>{request.loading ? <LoaderCircle className="animate-spin" size={14} /> : <ArrowRight size={14} />} Verify domain</button>{request.loading && <LoadingPanel label="Inspecting mail routes" />}<Result error={request.error} />{result && <div aria-live="polite" className="mt-5 border border-[#292929] bg-black"><div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7"><div className="flex items-center gap-4"><span className={`grid size-12 shrink-0 place-items-center border ${result.acceptsMail ? 'border-white bg-white text-black' : 'border-[#484848] bg-[#121212] text-[#A3A3A3]'}`}>{result.acceptsMail ? <MailCheck size={22} /> : <CircleX size={22} />}</span><div><p className="font-mono text-[9px] uppercase tracking-[.22em] text-[#666666]">Mail readiness</p><p className="mt-1 text-xl font-semibold tracking-[-.035em]">{result.acceptsMail ? 'Domain accepts mail' : 'No mail route found'}</p></div></div><span className="w-fit border border-[#292929] px-3 py-2 font-mono text-[9px] uppercase tracking-[.16em] text-[#A3A3A3]">Syntax {result.syntaxValid ? 'valid' : 'invalid'}</span></div><div className="border-t border-[#1F1F1F] p-5"><p className="text-sm leading-6 text-[#A3A3A3]">{result.verdict}</p><div className="mt-5 grid gap-2">{result.mx?.map((record) => <div key={`${record.priority}-${record.exchange}`} className="flex flex-col gap-2 border border-[#1F1F1F] bg-[#080808] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><span className="break-all font-mono text-xs text-[#D0D0D0]">{record.exchange}</span><span className="font-mono text-[9px] uppercase tracking-[.16em] text-[#666666]">Priority {record.priority}</span></div>)}</div></div></div>}</form>;
}

const dnsTypes = ['A', 'AAAA', 'CAA', 'CNAME', 'DNSKEY', 'DS', 'HTTPS', 'MX', 'NAPTR', 'NS', 'PTR', 'SOA', 'SRV', 'SVCB', 'TLSA', 'TXT'];

function DnsTool() {
  const request = useToolRequest(); const [domain, setDomain] = useState(''); const [type, setType] = useState('A'); const [includeRdap, setIncludeRdap] = useState(true);
  const result = request.data as { domain?: string; type?: string; resolver?: string; status?: number; answers?: Array<{ name: string; type: number; TTL: number; data: string }>; registration?: { handle?: string; domain?: string; status?: string[]; events?: Array<{ eventAction?: string; eventDate?: string }>; nameservers?: string[]; entities?: Array<{ handle?: string; roles?: string[] }> } } | undefined;
  return <form onSubmit={(e) => { e.preventDefault(); void request.run('dns', { domain, type, includeRdap }); }}><div className="mb-5 flex items-center justify-between border border-[#1F1F1F] bg-black p-4"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center border border-[#292929]"><Database size={16} /></span><div><p className="text-sm font-medium">Authoritative lookup</p><p className="mt-1 text-xs text-[#666666]">Resolved through Cloudflare 1.1.1.1</p></div></div><span className="hidden font-mono text-[9px] uppercase tracking-[.18em] text-[#666666] sm:block">DNS over HTTPS</span></div><div className="grid gap-4 sm:grid-cols-[1fr_10rem]"><Field label="Domain"><input className={inputClass} value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" required /></Field><CustomSelect label="Record type" value={type} options={dnsTypes} onChange={setType} /></div><div className="my-5"><Toggle checked={includeRdap} onChange={setIncludeRdap}>Include RDAP registration summary</Toggle></div><button className={buttonClass} disabled={request.loading}>{request.loading ? <LoaderCircle className="animate-spin" size={14} /> : <Search size={14} />} Query records</button>{request.loading && <LoadingPanel label="Resolving DNS records" />}<Result error={request.error} />{result && <div aria-live="polite" className="mt-5 border border-[#292929] bg-black"><div className="flex flex-col gap-4 border-b border-[#1F1F1F] p-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#666666]">Query result</p><p className="mt-2 break-all text-2xl font-semibold tracking-[-.04em]">{result.domain}</p></div><div className="flex gap-2"><span className="border border-[#292929] px-3 py-2 font-mono text-[9px] tracking-[.16em] text-[#BCBCBC]">{result.type}</span><span className="border border-[#292929] px-3 py-2 font-mono text-[9px] tracking-[.16em] text-[#858585]">{result.answers?.length || 0} records</span></div></div><div className="p-3 sm:p-5">{result.answers?.length ? <div className="grid gap-2">{result.answers.map((answer, index) => <div key={`${answer.name}-${answer.data}-${index}`} className="grid gap-3 border border-[#1F1F1F] bg-[#080808] p-4 sm:grid-cols-[3rem_1fr_5rem] sm:items-center"><span className="font-mono text-[9px] text-[#666666]">{String(index + 1).padStart(2, '0')}</span><span className="break-all font-mono text-xs leading-5 text-[#D0D0D0]">{answer.data}</span><span className="font-mono text-[9px] uppercase tracking-[.14em] text-[#666666] sm:text-right">TTL {answer.TTL}</span></div>)}</div> : <div className="grid min-h-32 place-items-center text-center"><div><Server className="mx-auto text-[#484848]" size={22} /><p className="mt-3 text-sm text-[#858585]">No {result.type} records returned.</p></div></div>}</div>{result.registration && <div className="border-t border-[#1F1F1F] p-5"><div className="mb-4 flex items-center gap-2"><Hash size={14} className="text-[#686868]" /><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#666666]">Registration intelligence</p></div><div className="grid gap-px border border-[#1F1F1F] bg-[#1F1F1F] sm:grid-cols-3"><div className="bg-black p-4"><p className="text-[9px] uppercase tracking-[.16em] text-[#666666]">Registry handle</p><p className="mt-2 break-all text-xs text-[#D0D0D0]">{result.registration.handle || 'Unavailable'}</p></div><div className="bg-black p-4"><p className="text-[9px] uppercase tracking-[.16em] text-[#666666]">Status</p><p className="mt-2 text-xs text-[#D0D0D0]">{result.registration.status?.slice(0, 2).join(', ') || 'Unavailable'}</p></div><div className="bg-black p-4"><p className="text-[9px] uppercase tracking-[.16em] text-[#666666]">Nameservers</p><p className="mt-2 text-xs text-[#D0D0D0]">{result.registration.nameservers?.length || 0} published</p></div></div></div>}</div>}</form>;
}

function FontUi() {
  const request = useToolRequest(); const [fonts, setFonts] = useState<string[]>([]); const [query, setQuery] = useState(''); const [sample, setSample] = useState('Designing in the quiet.'); const [selected, setSelected] = useState('Inter'); const [copied, setCopied] = useState<'styled' | 'css' | ''>('');
  useEffect(() => { void request.run('fontui', undefined, 'GET').then((result) => { if (Array.isArray(result?.fonts)) setFonts(result.fonts as string[]); }); }, [request.run]);
  useEffect(() => { const id = 'fontui-preview-font'; let link = document.getElementById(id) as HTMLLinkElement | null; if (!link) { link = document.createElement('link'); link.id = id; link.rel = 'stylesheet'; document.head.appendChild(link); } link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(selected).replace(/%20/g, '+')}:wght@400;600&display=swap`; }, [selected]);
  const visible = useMemo(() => fonts.filter((font) => font.toLowerCase().includes(query.toLowerCase())).slice(0, 80), [fonts, query]);
  const showCopied = (kind: 'styled' | 'css') => { setCopied(kind); window.setTimeout(() => setCopied(''), 1800); };
  const copyStyled = async () => {
    const text = sample || 'Type something.';
    const escapedText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const escapedFont = selected.replace(/'/g, '&#39;');
    const html = `<span style="font-family: '${escapedFont}', sans-serif;">${escapedText}</span>`;
    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) await navigator.clipboard.write([new ClipboardItem({ 'text/plain': new Blob([text], { type: 'text/plain' }), 'text/html': new Blob([html], { type: 'text/html' }) })]);
      else await navigator.clipboard.writeText(text);
      showCopied('styled');
    } catch { await navigator.clipboard.writeText(text); showCopied('styled'); }
  };
  const copyCss = async () => { await navigator.clipboard.writeText(`font-family: '${selected}', sans-serif;`); showCopied('css'); };
  return <><div className="mb-5 flex flex-col gap-3 border border-[#1F1F1F] bg-black p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium">Live typography laboratory</p><p className="mt-1 text-xs text-[#686868]">Select any family to apply it instantly to the canvas.</p></div><span className="w-fit border border-[#292929] px-3 py-2 font-mono text-[9px] uppercase tracking-[.16em] text-[#858585]">{fonts.length || '300+'} families</span></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Preview text"><input className={inputClass} value={sample} onChange={(e) => setSample(e.target.value.slice(0, 140))} /></Field><Field label={`Search ${fonts.length || '300+'} families`}><div className="relative"><Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#484848]" size={14} /><input className={`${inputClass} pl-11`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search fonts" /></div></Field></div><div className="relative mt-5 min-h-52 overflow-hidden border border-[#292929] bg-black p-5 sm:p-8"><div className="pointer-events-none absolute -right-16 -top-20 size-60 rounded-full bg-white/[.04] blur-3xl" /><p className="relative break-words text-[clamp(2rem,7vw,4.5rem)] leading-tight" style={{ fontFamily: `'${selected}', sans-serif` }}>{sample || 'Type something.'}</p><div className="relative mt-8 flex items-center justify-between border-t border-[#1F1F1F] pt-4"><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#858585]">{selected}</p><span className="font-mono text-[9px] text-[#484848]">Aa · 123</span></div></div><div className="mb-5 grid gap-2 border-x border-b border-[#292929] bg-black p-3 sm:grid-cols-2"><button type="button" className={buttonClass} onClick={copyStyled}>{copied === 'styled' ? <Check size={14} /> : <Copy size={14} />}{copied === 'styled' ? 'Styled text copied' : 'Copy styled text'}</button><button type="button" className={`${buttonClass} border border-[#292929] !bg-[#080808] !text-white hover:!bg-[#121212]`} onClick={copyCss}>{copied === 'css' ? <Check size={14} /> : <Copy size={14} />}{copied === 'css' ? 'CSS copied' : 'Copy font CSS'}</button></div>{request.loading ? <LoadingPanel label="Loading font catalog" /> : <div className="grid max-h-[32rem] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">{visible.map((font) => <button type="button" key={font} onClick={() => setSelected(font)} className={`group flex min-h-14 items-center justify-between border px-4 text-left text-sm transition-all duration-200 ${selected === font ? 'border-white bg-white text-black' : 'border-[#292929] bg-black text-[#BCBCBC] hover:border-[#686868] hover:bg-[#0d0d0d]'}`}><span>{font}</span><span className={`grid size-6 place-items-center border ${selected === font ? 'border-black/20' : 'border-[#292929] text-transparent group-hover:text-[#858585]'}`}><Check size={12} /></span></button>)}</div>}{!request.loading && visible.length === 0 && <div className="grid min-h-32 place-items-center border border-[#292929] bg-black text-center"><p className="text-sm text-[#686868]">No matching font families.</p></div>}{request.error && <Result error={request.error} />}</>;
}

function SpotifyPreview() {
  const [value, setValue] = useState(''); const [embed, setEmbed] = useState(''); const [error, setError] = useState('');
  const parse = () => { setError(''); try { const url = new URL(value); if (url.hostname !== 'open.spotify.com') throw new Error('Use a valid open.spotify.com link.'); const parts = url.pathname.split('/').filter(Boolean); const typeIndex = parts.findIndex((p) => ['track', 'album', 'playlist', 'artist', 'episode', 'show'].includes(p)); const type = parts[typeIndex]; const id = parts[typeIndex + 1]; if (!type || !/^[A-Za-z0-9]{10,40}$/.test(id || '')) throw new Error('This Spotify link is not supported.'); setEmbed(`https://open.spotify.com/embed/${type}/${id}`); } catch (cause) { setEmbed(''); setError(cause instanceof Error ? cause.message : 'Invalid Spotify link.'); } };
  return <><div className="mb-5 overflow-hidden border border-[#1F1F1F] bg-black"><div className="flex items-center gap-4 p-5"><span className="grid size-11 shrink-0 place-items-center rounded-full border border-[#484848] bg-[#121212]"><MusicIcon /></span><div><p className="text-sm font-medium">Official Spotify playback</p><p className="mt-1 text-xs leading-5 text-[#686868]">Private, lawful, and powered by Spotify’s own embed player.</p></div></div><div className="flex flex-wrap gap-2 border-t border-[#1F1F1F] p-3">{['Track', 'Album', 'Playlist', 'Artist', 'Podcast'].map((item) => <span key={item} className="border border-[#292929] px-3 py-1.5 font-mono text-[8px] uppercase tracking-[.16em] text-[#666666]">{item}</span>)}</div></div><form onSubmit={(e) => { e.preventDefault(); parse(); }}><Field label="Spotify URL" hint="Playback stays inside Spotify’s official embed. This tool does not download, extract, or convert copyrighted audio."><input className={inputClass} value={value} onChange={(e) => setValue(e.target.value)} placeholder="https://open.spotify.com/track/..." required /></Field><button className={`${buttonClass} mt-5`}><MusicIcon /> Open preview</button></form>{error && <Result error={error} />}{embed && <div className="mt-6 overflow-hidden border border-[#292929] bg-black p-2 shadow-2xl shadow-black"><div className="mb-2 flex items-center justify-between px-2 py-1"><p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#666666]">Now ready</p><span className="size-1.5 rounded-full bg-white" /></div><iframe className="rounded-lg" title="Spotify preview" src={embed} width="100%" height="352" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" /></div>}</>;
}

function MusicIcon() { return <span aria-hidden="true">▶</span>; }

function QuoteTool() {
  const request = useToolRequest(); const [copied, setCopied] = useState(false);
  useEffect(() => { void request.run('quote', undefined, 'GET'); }, [request.run]);
  const quote = request.data as { quote?: string; author?: string } | undefined;
  const copy = async () => { if (!quote?.quote) return; await navigator.clipboard.writeText(`“${quote.quote}” — ${quote.author || 'Unknown'}`); setCopied(true); window.setTimeout(() => setCopied(false), 1600); };
  return <div><div className="relative min-h-72 overflow-hidden border border-[#292929] bg-black p-6 sm:p-10"><div className="pointer-events-none absolute -right-16 -top-28 font-serif text-[18rem] leading-none text-white/[.035]">“</div><div className="relative flex h-full min-h-52 flex-col justify-between">{request.loading ? <div className="grid min-h-52 place-items-center"><LoaderCircle className="animate-spin text-[#858585]" /></div> : <><div><p className="mb-6 font-mono text-[9px] uppercase tracking-[.24em] text-[#666666]">Daily perspective / live signal</p><blockquote className="max-w-4xl text-[clamp(1.7rem,5vw,3.5rem)] font-medium leading-[1.08] tracking-[-.04em] text-[#F7F7F7]">{quote?.quote ? `“${quote.quote}”` : 'No signal yet.'}</blockquote></div>{quote?.author && <p className="mt-8 border-t border-[#1F1F1F] pt-5 font-mono text-[10px] uppercase tracking-[.25em] text-[#858585]">— {quote.author}</p>}</>}</div></div><div className="mt-4 flex flex-wrap gap-3"><button className={buttonClass} onClick={() => request.run('quote', undefined, 'GET')} disabled={request.loading}><RefreshCw size={14} /> Another quote</button><button className={`${buttonClass} border border-[#292929] !bg-black !text-white`} onClick={copy} disabled={!quote?.quote}>{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}</button><a className={`${buttonClass} border border-[#292929] !bg-black !text-white`} href="https://dummyjson.com/docs/quotes" target="_blank" rel="noreferrer">Source <ExternalLink size={13} /></a></div><Result error={request.error} /></div>;
}

const views: Record<ToolSlug, React.ComponentType> = { whatismyip: WhatIsMyIp, portcheck: PortCheck, mailfy: Mailfy, dns: DnsTool, fontui: FontUi, spotmp3: SpotifyPreview, quote: QuoteTool, keytest: KeyboardTester };

export default function ToolClient({ slug }: { slug: ToolSlug }) {
  const tool = getTool(slug);
  if (!tool) return null;
  const View = views[tool.slug];
  return <ToolFrame tool={tool}><View /></ToolFrame>;
}
