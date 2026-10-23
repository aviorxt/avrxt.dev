'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, LockKeyhole, LogOut, Pencil, Send, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import { BrandIcon } from '@/components/BrandIcon';
import { Bubble, BubbleContent, BubbleReactions } from '@/components/ui/bubble';
import { Shimmer } from '@/components/ui/shimmer';
import Turnstile, { turnstileClientEnabled } from '@/components/Turnstile';

export type GuestbookEntry = { id: string; author_id: string; provider: 'discord' | 'github'; display_name: string; avatar_url: string | null; message: string; created_at: string; updated_at: string };
export type GuestbookViewer = { id: string; displayName: string; avatarUrl: string | null; provider: 'discord' | 'github' };

const date = (value: string) => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
const providerLabel = (provider: GuestbookEntry['provider']) => provider === 'discord' ? 'Discord' : 'GitHub';

export default function GuestbookClient({ initialEntries, viewer, enabled }: { initialEntries: GuestbookEntry[]; viewer: GuestbookViewer | null; enabled: boolean }) {
  const router = useRouter();
  const [entries, setEntries] = useState(initialEntries);
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [notice, setNotice] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileNonce, setTurnstileNonce] = useState(0);
  const turnstileRequired = turnstileClientEnabled('guestbook');
  const ownEntries = useMemo(() => new Set(entries.filter((entry) => entry.author_id === viewer?.id).map((entry) => entry.id)), [entries, viewer]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!message.trim() || pending) return;
    if (turnstileRequired && !turnstileToken) { setNotice('Complete the security check before saving your note.'); return; }
    setPending(true);
    setNotice('');
    const response = await fetch('/api/guestbook', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing ? { id: editing, message, turnstileToken } : { message, turnstileToken }) });
    const data = await response.json().catch(() => ({}));
    setPending(false);
    if (turnstileRequired) { setTurnstileToken(null); setTurnstileNonce((value) => value + 1); }
    if (!response.ok || !data.entry) {
      setNotice(data.error === 'GUESTBOOK_DISABLED' ? 'Guestbook is currently closed.' : data.error || 'Could not save your message.');
      return;
    }
    setEntries((current) => editing ? current.map((entry) => entry.id === data.entry.id ? data.entry : entry) : [data.entry, ...current]);
    setMessage('');
    setEditing(null);
    setNotice(editing ? 'Your note has been updated.' : 'Your footprint is now part of the record.');
  }

  function beginEdit(entry: GuestbookEntry) {
    setEditing(entry.id);
    setMessage(entry.message);
    setNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function remove(id: string) {
    if (turnstileRequired && !turnstileToken) { setNotice('Complete the security check before removing your note.'); return; }
    setPending(true);
    const response = await fetch(`/api/guestbook?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers: turnstileToken ? { 'X-Turnstile-Token': turnstileToken } : undefined });
    setPending(false);
    if (turnstileRequired) { setTurnstileToken(null); setTurnstileNonce((value) => value + 1); }
    setDeleting(null);
    if (!response.ok) return setNotice('Could not delete this message.');
    setEntries((current) => current.filter((entry) => entry.id !== id));
    setNotice('Your note has been removed.');
  }

  async function signOut() {
    setSigningOut(true);
    const response = await fetch('/guestbook/logout', { method: 'POST' });
    if (!response.ok) {
      setSigningOut(false);
      setNotice('Could not sign out. Please try again.');
      return;
    }
    router.replace('/guestbook');
    router.refresh();
  }

  if (!enabled) return <GuestbookClosed />;

  return <main className="relative isolate min-h-screen overflow-hidden bg-[#050505] text-white">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-60 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:42px_42px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
    <div aria-hidden="true" className="pointer-events-none absolute -top-48 left-1/2 -z-10 size-[42rem] -translate-x-1/2 rounded-full bg-white/[.045] blur-3xl" />
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pb-24 sm:pt-12 lg:px-8">
      <header className="guestbook-enter border-b border-white/10 pb-9 sm:pb-12">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="group inline-flex min-h-11 items-center rounded-xl border border-white/10 bg-black/20 px-4 transition hover:border-white/25 hover:bg-white/[.035]" aria-label="Back to AVRXT home"><img src="/assets/logo/avrxt-vector-slash.png" alt="AVRXT" className="h-4 w-auto opacity-95 transition group-hover:opacity-100" /></Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-2 font-mono text-[9px] uppercase tracking-[.16em] text-zinc-400"><span className="size-1.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,.85)]" />Public record</div>
        </div>
        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[.28em] text-zinc-500">AVRXT / guestbook</p><h1 className="mt-4 max-w-3xl text-[clamp(3rem,9vw,6.75rem)] font-semibold leading-[.84] tracking-[-.085em] text-white">Leave a<br /><span className="text-zinc-500">FootPrint.</span></h1><p className="mt-6 max-w-xl text-pretty text-sm leading-7 text-zinc-400 sm:text-base">A public record for kind notes, signals, and memories from people who passed through AVRXT.</p></div><div className="border-l border-white/10 pl-5 sm:pl-6"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-zinc-600">Archive status</p><p className="mt-3 text-3xl font-medium tracking-[-.06em]">{entries.length.toString().padStart(2, '0')}</p><p className="mt-1 text-xs text-zinc-500">{entries.length === 1 ? 'signed note' : 'signed notes'} recorded</p></div></div>
      </header>
      <section className="grid gap-8 py-9 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-12 lg:py-14"><div className="min-w-0"><Composer viewer={viewer} message={message} editing={editing} notice={notice} pending={pending} signingOut={signingOut} turnstileRequired={turnstileRequired} turnstileToken={turnstileToken} turnstileNonce={turnstileNonce} onTurnstileToken={setTurnstileToken} onTurnstileError={() => setNotice('The security check could not load. Refresh and try again.')} onSignOut={() => void signOut()} onMessageChange={setMessage} onCancel={() => { setEditing(null); setMessage(''); setNotice(''); }} onSubmit={submit} /><section aria-label="Guestbook entries" className="mt-10"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-mono text-[10px] uppercase tracking-[.22em] text-zinc-500">Latest footprints</h2><span className="text-xs text-zinc-600">{entries.length} total</span></div><div className="space-y-4">{entries.length ? entries.map((entry, index) => <Entry key={entry.id} entry={entry} own={ownEntries.has(entry.id)} deleting={deleting === entry.id} pending={pending} index={index} onEdit={() => beginEdit(entry)} onAskDelete={() => setDeleting(entry.id)} onCancelDelete={() => setDeleting(null)} onDelete={() => void remove(entry.id)} />) : <EmptyState />}</div></section></div><aside className="h-fit space-y-4 lg:sticky lg:top-8"><div className="rounded-2xl border border-white/10 bg-black/35 p-5 shadow-2xl shadow-black/20 backdrop-blur sm:p-6"><ShieldCheck className="size-5 text-zinc-300" /><p className="mt-5 font-mono text-[10px] uppercase tracking-[.2em] text-zinc-500">Guestbook protocol</p><ul className="mt-5 space-y-4 text-sm leading-6 text-zinc-400"><li>Leave a message worth keeping.</li><li>Only its signed-in author can edit or remove it.</li><li>Never post passwords, private keys, or personal data.</li></ul></div><div className="rounded-2xl border border-white/[.08] bg-white/[.025] p-5"><p className="font-mono text-[9px] uppercase tracking-[.17em] text-zinc-600">Identity providers</p><div className="mt-4 flex items-center gap-3 text-zinc-400"><BrandIcon name="Discord" className="size-4" /><BrandIcon name="Github" className="size-4" /><span className="text-xs">Discord &amp; GitHub</span></div></div></aside></section>
    </div>
  </main>;
}

function Composer({ viewer, message, editing, notice, pending, signingOut, turnstileRequired, turnstileToken, turnstileNonce, onTurnstileToken, onTurnstileError, onSignOut, onMessageChange, onCancel, onSubmit }: { viewer: GuestbookViewer | null; message: string; editing: string | null; notice: string; pending: boolean; signingOut: boolean; turnstileRequired: boolean; turnstileToken: string | null; turnstileNonce: number; onTurnstileToken: (token: string | null) => void; onTurnstileError: () => void; onSignOut: () => void; onMessageChange: (message: string) => void; onCancel: () => void; onSubmit: (event: FormEvent) => void }) {
  if (!viewer) return <section className="guestbook-enter-delayed overflow-hidden rounded-2xl border border-white/10 bg-[#090909]/85 p-5 shadow-2xl shadow-black/20 backdrop-blur sm:p-7"><div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-zinc-200"><LockKeyhole size={18} /></span><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-zinc-500">Identity required</p><h2 className="mt-2 text-2xl font-semibold tracking-[-.05em]">Sign in to write.</h2><p className="mt-3 max-w-lg text-sm leading-6 text-zinc-400">Your provider name and avatar are shown next to the message you choose to publish. Nothing else is displayed.</p></div></div><div className="mt-7 grid gap-3 sm:grid-cols-2"><ProviderButton provider="discord" /><ProviderButton provider="github" /></div></section>;
  return <section className="guestbook-enter-delayed rounded-2xl border border-white/10 bg-[#090909]/85 p-5 shadow-2xl shadow-black/20 backdrop-blur sm:p-7"><div className="mb-5 flex items-center gap-3"><Avatar name={viewer.displayName} src={viewer.avatarUrl} /><div className="min-w-0"><p className="truncate text-sm font-medium text-zinc-100">{viewer.displayName}</p><p className="mt-0.5 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[.14em] text-zinc-500"><BrandIcon name={viewer.provider === 'discord' ? 'Discord' : 'Github'} className="size-3" />Signed in with {providerLabel(viewer.provider)}</p></div><button type="button" disabled={signingOut} onClick={onSignOut} className="ml-auto inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 text-[10px] text-zinc-400 transition hover:border-white/25 hover:bg-white/[.04] hover:text-white disabled:cursor-wait disabled:opacity-50"><LogOut size={13} />{signingOut ? 'Signing out…' : 'Sign out'}</button></div><form onSubmit={onSubmit}><label className="sr-only" htmlFor="guestbook-message">Your guestbook note</label><div className="relative"><textarea id="guestbook-message" value={message} onChange={(event) => onMessageChange(event.target.value)} maxLength={600} placeholder="Leave a kind note, a signal, or a memory…" className="min-h-36 w-full resize-y rounded-xl border border-white/10 bg-black/50 p-4 pr-5 text-sm leading-7 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-white/40 focus:bg-black/70 sm:min-h-40" /><span className="absolute bottom-3 right-4 font-mono text-[9px] text-zinc-600">{message.length}/600</span></div>{turnstileRequired && <div className="mt-4 border border-white/10 bg-black/25 p-3"><p className="mb-3 font-mono text-[9px] uppercase tracking-[.16em] text-zinc-500">Security verification</p><Turnstile key={turnstileNonce} scope="guestbook" onTokenChange={onTurnstileToken} onError={onTurnstileError} /></div>}<div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-zinc-500">Your identity is attached automatically.</p><div className="flex gap-2">{editing && <button type="button" onClick={onCancel} className="min-h-10 rounded-lg border border-white/10 px-4 text-xs text-zinc-300 transition hover:border-white/25 hover:bg-white/[.04]">Cancel</button>}<button disabled={pending || !message.trim() || (turnstileRequired && !turnstileToken)} className="relative inline-flex min-h-10 items-center gap-2 overflow-hidden rounded-lg bg-white px-4 text-xs font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"><Shimmer /><span className="relative flex items-center gap-2"><Send size={14} />{pending ? 'Saving…' : editing ? 'Update note' : 'Leave footprint'}</span></button></div></div></form>{notice && <p role="status" className="mt-4 flex items-center gap-2 text-xs text-zinc-300"><Check size={14} />{notice}</p>}</section>;
}

function ProviderButton({ provider }: { provider: 'discord' | 'github' }) { const discord = provider === 'discord'; return <a href={`/guestbook/auth?provider=${provider}`} className="group relative flex min-h-14 items-center gap-3 overflow-hidden rounded-xl border border-white/10 bg-white/[.025] px-4 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[.06]"><Shimmer className="opacity-0 transition-opacity group-hover:opacity-100" /><span className="relative grid size-8 place-items-center rounded-lg border border-white/10 bg-black/30"><BrandIcon name={discord ? 'Discord' : 'Github'} className="size-4" /></span><span className="relative">Continue with {discord ? 'Discord' : 'GitHub'}</span></a>; }
function Entry({ entry, own, deleting, pending, index, onEdit, onAskDelete, onCancelDelete, onDelete }: { entry: GuestbookEntry; own: boolean; deleting: boolean; pending: boolean; index: number; onEdit: () => void; onAskDelete: () => void; onCancelDelete: () => void; onDelete: () => void }) { return <article className="guestbook-entry group rounded-2xl border border-white/[.09] bg-[#080808]/80 p-4 transition duration-300 hover:border-white/20 hover:bg-white/[.025] sm:p-5" style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}><div className="flex items-start gap-3"><Avatar name={entry.display_name} src={entry.avatar_url} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-medium text-zinc-100">{entry.display_name}</p><p className="mt-1 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[.13em] text-zinc-600"><BrandIcon name={entry.provider === 'discord' ? 'Discord' : 'Github'} className="size-3" />{providerLabel(entry.provider)} · {date(entry.created_at)}{entry.updated_at !== entry.created_at ? ' · edited' : ''}</p></div>{own && !deleting && <div className="flex items-center gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"><button onClick={onEdit} className="grid size-8 place-items-center rounded-lg text-zinc-500 transition hover:bg-white/[.06] hover:text-white" aria-label="Edit your message"><Pencil size={14} /></button><button onClick={onAskDelete} className="grid size-8 place-items-center rounded-lg text-zinc-500 transition hover:bg-white/[.06] hover:text-red-300" aria-label="Delete your message"><Trash2 size={14} /></button></div>}</div><Bubble variant="secondary" className="mt-4 max-w-full"><BubbleContent variant="secondary" className="border-white/[.08] bg-white/[.035] text-zinc-300">{entry.message}</BubbleContent><BubbleReactions><span>Public note</span></BubbleReactions></Bubble>{deleting && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-400/20 bg-red-400/[.05] p-3"><p className="text-xs text-zinc-300">Remove this note permanently?</p><div className="flex gap-2"><button onClick={onCancelDelete} className="min-h-8 rounded-md px-3 text-xs text-zinc-300 hover:bg-white/[.06]">Keep it</button><button disabled={pending} onClick={onDelete} className="min-h-8 rounded-md bg-red-300 px-3 text-xs font-semibold text-black disabled:opacity-50">Remove</button></div></div>}</div></div></article>; }
function EmptyState() { return <div className="rounded-2xl border border-dashed border-white/15 bg-white/[.015] px-6 py-12 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/[.025] text-zinc-500"><Sparkles size={19} /></span><h3 className="mt-5 text-lg font-medium">No footprints yet.</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">The first message will start the public record.</p></div>; }
function GuestbookClosed() { return <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#050505] px-4 text-white"><div aria-hidden="true" className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:42px_42px]" /><section className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#090909]/90 p-7 text-center shadow-2xl shadow-black/50 backdrop-blur sm:p-10"><span className="mx-auto grid size-14 place-items-center rounded-2xl border border-white/10 bg-white/[.04] text-zinc-300"><LockKeyhole size={22} /></span><p className="mt-6 font-mono text-[10px] uppercase tracking-[.2em] text-zinc-500">Public record paused</p><h1 className="mt-3 text-3xl font-semibold tracking-[-.06em]">Guestbook is closed.</h1><p className="mt-4 text-sm leading-7 text-zinc-400">The AVRXT guestbook is not accepting notes right now. Please check back later.</p><Link href="/" className="mt-8 inline-flex min-h-11 items-center rounded-lg border border-white/10 px-4 text-sm transition hover:border-white/25 hover:bg-white/[.04]">Return home</Link></section></main>; }
function Avatar({ name, src }: { name: string; src: string | null }) { return src ? <img src={src} alt="" className="size-10 shrink-0 rounded-full border border-white/15 object-cover" referrerPolicy="no-referrer" /> : <span className="grid size-10 shrink-0 place-items-center rounded-full border border-white/15 bg-white/5 text-xs font-semibold text-zinc-300">{name.slice(0, 1).toUpperCase()}</span>; }
