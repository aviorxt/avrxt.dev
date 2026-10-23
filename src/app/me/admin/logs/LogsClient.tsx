'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, CircleAlert, Filter, LoaderCircle, RefreshCw, Search, ShieldAlert, Trash2, UserRound } from 'lucide-react';
import { clearAuditLogsAction, deleteAuditLogAction, listAuditLogsAction } from '@/app/actions/audit-logs';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { AuditLog, AuditLogFilters, AuditSeverity, AuditStatus } from '@/lib/audit-logs';

type Result = { logs: AuditLog[]; total: number; configured: boolean; error?: string };
const input = 'w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white outline-none transition placeholder:text-zinc-600 focus:border-white/30';

function tone(severity: AuditSeverity) {
  return severity === 'error' ? 'border-red-400/30 bg-red-400/10 text-red-200' : severity === 'security' ? 'border-amber-300/30 bg-amber-300/10 text-amber-100' : severity === 'warning' ? 'border-orange-300/30 bg-orange-300/10 text-orange-100' : 'border-sky-300/20 bg-sky-300/10 text-sky-100';
}

function prettyDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'medium' }).format(new Date(value));
}

export default function LogsClient({ initial }: { initial: Result }) {
  const [result, setResult] = useState(initial);
  const [filters, setFilters] = useState<AuditLogFilters>({ page: 1 });
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<AuditLog | null>(initial.logs[0] || null);
  const [confirm, setConfirm] = useState<{ type: 'clear' } | { type: 'delete'; log: AuditLog } | null>(null);
  const totalPages = Math.max(1, Math.ceil(result.total / 50));
  const categories = useMemo(() => [...new Set(result.logs.map(log => log.category))].sort(), [result.logs]);
  const status = result.error ? `ERROR: ${result.error}` : !result.configured ? 'NEON_LOGS_DATABASE_URL is not configured yet.' : `${result.total} event${result.total === 1 ? '' : 's'} in audit storage.`;
  const load = async (next: AuditLogFilters = filters) => {
    setBusy(true);
    try {
      const response = await listAuditLogsAction(next);
      if ('error' in response) setResult(current => ({ ...current, error: response.error }));
      else { setResult(response); setSelected(response.logs[0] || null); }
    } finally { setBusy(false); }
  };
  const apply = () => { const next = { ...filters, query: query.trim(), page: 1 }; setFilters(next); void load(next); };
  const changePage = (page: number) => { const next = { ...filters, page }; setFilters(next); void load(next); };
  const deleteOne = async () => {
    if (!confirm || confirm.type !== 'delete') return;
    setBusy(true);
    const target = confirm.log;
    setConfirm(null);
    try { const response = await deleteAuditLogAction(target.id); if ('error' in response) setResult(current => ({ ...current, error: response.error })); else await load(); } finally { setBusy(false); }
  };
  const clear = async () => {
    setBusy(true); setConfirm(null);
    try { const response = await clearAuditLogsAction(); if ('error' in response) setResult(current => ({ ...current, error: response.error })); else await load({ page: 1 }); } finally { setBusy(false); }
  };
  return <div className="space-y-6">
    <ConfirmDialog open={confirm?.type === 'clear'} title="Clear all audit logs" description="This permanently removes every current audit event. A new administrative clear event will be retained as the first record." confirmLabel="Clear logs" danger busy={busy} onCancel={() => setConfirm(null)} onConfirm={() => void clear()} />
    <ConfirmDialog open={confirm?.type === 'delete'} title="Delete audit log" description="This permanently removes the selected event from Neon audit storage." confirmLabel="Delete log" danger busy={busy} onCancel={() => setConfirm(null)} onConfirm={() => void deleteOne()} />
    <header className="flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.28em] text-zinc-500"><ShieldAlert size={13} /> Security / Neon Postgres</div><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Audit logs</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Review admin activity, visitor actions, security events, and application operations from private server-side audit storage.</p></div><div className="flex gap-2"><button type="button" onClick={() => void load()} disabled={busy} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/15 px-3 text-xs font-medium transition hover:bg-white/5 disabled:opacity-50"><RefreshCw size={14} className={busy ? 'animate-spin' : ''} /> Refresh</button><button type="button" onClick={() => setConfirm({ type: 'clear' })} disabled={busy || !result.logs.length} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-300/25 px-3 text-xs font-medium text-red-200 transition hover:bg-red-400/10 disabled:opacity-50"><Trash2 size={14} /> Clear logs</button></div></header>
    <p role="status" aria-live="polite" className={`rounded-xl border px-4 py-3 text-xs ${status.startsWith('ERROR') || !result.configured ? 'border-amber-400/25 bg-amber-400/5 text-amber-100' : 'border-white/10 bg-white/[0.025] text-zinc-400'}`}>{status}</p>
    <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"><div className="flex items-center gap-2 pb-3 text-xs font-medium text-zinc-300"><Filter size={14} /> Filter events</div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5"><label className="relative lg:col-span-2"><Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" /><input value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') apply(); }} className={`${input} pl-9`} placeholder="Search actor, action, or message" /></label><select value={filters.category || ''} onChange={event => setFilters(current => ({ ...current, category: event.target.value, page: 1 }))} className={input}><option value="">All categories</option>{categories.map(category => <option value={category} key={category}>{category}</option>)}</select><select value={filters.severity || ''} onChange={event => setFilters(current => ({ ...current, severity: event.target.value as AuditSeverity | '', page: 1 }))} className={input}><option value="">All severities</option><option value="info">Info</option><option value="warning">Warning</option><option value="security">Security</option><option value="error">Error</option></select><select value={filters.status || ''} onChange={event => setFilters(current => ({ ...current, status: event.target.value as AuditStatus | '', page: 1 }))} className={input}><option value="">All outcomes</option><option value="success">Success</option><option value="blocked">Blocked</option><option value="failure">Failure</option></select></div><div className="mt-3 flex justify-end"><button type="button" onClick={apply} disabled={busy} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-white px-3 text-xs font-semibold text-black hover:bg-zinc-200 disabled:opacity-50">{busy ? <LoaderCircle size={14} className="animate-spin" /> : <Filter size={14} />} Apply filters</button></div></section>
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]"><div className="overflow-hidden rounded-2xl border border-white/10"><div className="divide-y divide-white/10">{result.logs.map(log => <button type="button" key={log.id} onClick={() => setSelected(log)} className={`flex w-full items-start gap-3 p-4 text-left transition hover:bg-white/[.035] ${selected?.id === log.id ? 'bg-white/[.045]' : ''}`}><span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border ${tone(log.severity)}`}>{log.severity === 'error' ? <CircleAlert size={15} /> : log.severity === 'security' ? <ShieldAlert size={15} /> : log.status === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}</span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><strong className="text-sm font-medium text-zinc-100">{log.message}</strong><span className={`rounded-full border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${tone(log.severity)}`}>{log.severity}</span></span><span className="mt-1 block font-mono text-[10px] text-zinc-500">{log.category} · {log.action} · {prettyDate(log.created_at)}</span></span></button>)}{!result.logs.length && <div className="p-12 text-center text-sm text-zinc-500"><ShieldAlert className="mx-auto mb-3" size={24} />No events match the current filters.</div>}</div><footer className="flex items-center justify-between border-t border-white/10 px-4 py-3"><span className="font-mono text-[10px] text-zinc-500">Page {filters.page || 1} / {totalPages}</span><span className="flex gap-1"><button type="button" aria-label="Previous page" disabled={busy || (filters.page || 1) <= 1} onClick={() => changePage((filters.page || 1) - 1)} className="rounded-md p-2 hover:bg-white/10 disabled:opacity-30"><ChevronLeft size={15} /></button><button type="button" aria-label="Next page" disabled={busy || (filters.page || 1) >= totalPages} onClick={() => changePage((filters.page || 1) + 1)} className="rounded-md p-2 hover:bg-white/10 disabled:opacity-30"><ChevronRight size={15} /></button></span></footer></div>
      <aside className="min-h-64 rounded-2xl border border-white/10 bg-white/[0.025] p-5">{selected ? <><div className="mb-5 flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-zinc-500">Event details</p><h2 className="mt-2 text-base font-semibold">{selected.event_type}</h2></div><button type="button" onClick={() => setConfirm({ type: 'delete', log: selected })} disabled={busy} className="rounded-lg p-2 text-red-200 hover:bg-red-400/10" aria-label="Delete this log"><Trash2 size={15} /></button></div><dl className="space-y-3 text-xs"><div><dt className="text-zinc-500">Actor</dt><dd className="mt-1 flex items-center gap-2 text-zinc-200"><UserRound size={13} />{selected.actor_name || 'System'} <span className="font-mono text-[10px] text-zinc-500">{selected.actor_role}</span></dd></div><div><dt className="text-zinc-500">Outcome</dt><dd className="mt-1 text-zinc-200">{selected.status} · {selected.severity}</dd></div><div><dt className="text-zinc-500">Message</dt><dd className="mt-1 leading-5 text-zinc-200">{selected.message}</dd></div><div><dt className="text-zinc-500">Recorded</dt><dd className="mt-1 text-zinc-300">{prettyDate(selected.created_at)}</dd></div>{Object.keys(selected.metadata || {}).length ? <div><dt className="text-zinc-500">Safe metadata</dt><dd className="mt-1 overflow-auto rounded-lg border border-white/10 bg-black/30 p-3 font-mono text-[10px] leading-5 text-zinc-300">{JSON.stringify(selected.metadata, null, 2)}</dd></div> : null}</dl></> : <div className="grid h-full place-items-center text-center text-sm text-zinc-500">Select an event to inspect its safe metadata.</div>}</aside></section>
  </div>;
}
