'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, CheckCircle2, Github, Instagram, LoaderCircle, Mail, Send } from 'lucide-react';


type Status = { type: 'success' | 'error'; message: string } | null;

export default function Contact() {
  const [status, setStatus] = useState<Status>(null);
  const [submitting, setSubmitting] = useState(false);
  const [draft, setDraft] = useState<Record<string, FormDataEntryValue> | null>(null);
  const pending = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  function review(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    setDraft(Object.fromEntries(new FormData(form)));
    setStatus(null);
  }
  async function confirm() {
    if (!draft || pending.current) return; pending.current = true; setSubmitting(true); setStatus(null);
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(draft) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'The message could not be sent.');
      formRef.current?.reset(); setDraft(null); setStatus({ type: 'success', message: `Your message has been sent. We’ll review and get back to you within 72 hours. ${result.receiptDelivered ? 'A receipt has been sent to your email.' : 'We could not send an email receipt; keep your reference for follow-up.'} Reference: ${result.reference}` });
    } catch (cause) { setStatus({ type: 'error', message: cause instanceof Error ? cause.message : 'The connection failed.' }); }
    finally { pending.current = false; setSubmitting(false); }
  }

  const field = 'min-h-13 w-full border border-[#292929] bg-[#080808] px-4 text-sm text-white outline-none transition-all placeholder:text-[#484848] focus:border-[#D0D0D0] focus:bg-black';
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-24 pt-28 sm:px-6 sm:pt-36">
      <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
        <section className="page-enter lg:sticky lg:top-32 lg:self-start">
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[.3em] text-[#666666]">// Contact / Open channel</p>
          <h1 className="text-[clamp(3.8rem,12vw,8.5rem)] font-semibold uppercase leading-[.74] tracking-[-.08em]">Start a<br /><span className="contact-outline">signal.</span></h1>
          <p className="mt-8 max-w-md text-sm leading-7 text-[#A3A3A3]">Share the problem, the context, and what a useful outcome looks like. Clear briefs get clearer answers.</p>
          <div className="mt-9 space-y-3 border-t border-[#1F1F1F] pt-6 font-mono text-[10px] uppercase tracking-[.16em] text-[#858585]">
            <a href="mailto:support@avrxt.dev" className="group flex min-h-11 items-center justify-between border-b border-[#1F1F1F] pb-3 hover:text-white"><span className="flex items-center gap-3"><Mail size={14} /> support@avrxt.dev</span><ArrowUpRight size={13} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a>
            <Link href="https://github.com/aviorxt" target="_blank" rel="noreferrer" className="group flex min-h-11 items-center justify-between border-b border-[#1F1F1F] pb-3 hover:text-white"><span className="flex items-center gap-3"><Github size={14} /> GitHub</span><ArrowUpRight size={13} /></Link>
            <Link href="https://www.instagram.com/aviorxt/" target="_blank" rel="noreferrer" className="group flex min-h-11 items-center justify-between border-b border-[#1F1F1F] pb-3 hover:text-white"><span className="flex items-center gap-3"><Instagram size={14} /> @aviorxt</span><ArrowUpRight size={13} /></Link>
          </div>
        </section>

        <section className="contact-panel page-enter border border-[#1F1F1F] bg-[#080808]/90 p-5 sm:p-8 lg:p-10">
          <div className="mb-8 flex items-center justify-between border-b border-[#1F1F1F] pb-5"><div><p className="font-mono text-[9px] uppercase tracking-[.25em] text-[#666666]">Direct contact channel</p><h2 className="mt-2 text-xl font-semibold">Tell me what you’re building.</h2></div><span className="hidden size-2 rounded-full bg-white shadow-[0_0_16px_#fff] sm:block" /></div>
          {status && <div role="status" className={`mb-6 flex gap-3 border p-4 text-xs leading-6 ${status.type === 'success' ? 'border-white/20 bg-white/[.04] text-[#D0D0D0]' : 'border-red-400/30 bg-red-400/5 text-red-200'}`}>{status.type === 'success' && <CheckCircle2 className="mt-1 shrink-0" size={15} />}{status.message}</div>}
          <form ref={formRef} onSubmit={review} className="space-y-5"><div className="hidden" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label><span className="mb-2 block font-mono text-[9px] uppercase tracking-[.2em] text-[#858585]">01 / Name</span><input className={field} name="name" autoComplete="name" maxLength={120} placeholder="Your name" required /></label>
              <label><span className="mb-2 block font-mono text-[9px] uppercase tracking-[.2em] text-[#858585]">02 / Email</span><input className={field} name="email" type="email" autoComplete="email" maxLength={254} placeholder="you@example.com" required /></label>
            </div>
            <label className="block"><span className="mb-2 block font-mono text-[9px] uppercase tracking-[.2em] text-[#858585]">03 / Message</span><textarea className={`${field} min-h-52 resize-y py-4 leading-7`} name="message" maxLength={5000} placeholder="Scope, constraints, timeline, or the question you want answered…" required /></label>
            <div className="flex flex-col gap-4 border-t border-[#1F1F1F] pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-sm text-[11px] leading-5 text-[#666666]">Your details are sent directly to AVRXT’s private Discord channel. By sending, you agree to the <Link href="/legal/terms" className="underline underline-offset-4 hover:text-white">terms</Link> and acknowledge the <Link href="/legal/privacy" className="underline underline-offset-4 hover:text-white">privacy notice</Link>.</p><button type="submit" disabled={submitting} className="inline-flex min-h-13 shrink-0 items-center justify-center gap-3 bg-[#F7F7F7] px-6 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-black transition-all hover:bg-white disabled:opacity-50"><Send size={14} />Review signal</button></div>
          </form>
          {draft && <section className="mt-5 border border-white/15 bg-white/[.035] p-4" aria-label="Confirm contact message"><p className="font-mono text-[9px] uppercase tracking-[.18em] text-zinc-400">Ready to send</p><p className="mt-2 text-sm text-zinc-200">Send this message to AVRXT’s private contact channel?</p><p className="mt-1 truncate font-mono text-[10px] text-zinc-500">From: {String(draft.email || '')}</p><div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => setDraft(null)} disabled={submitting} className="min-h-10 border border-white/15 px-4 font-mono text-[10px] uppercase tracking-[.12em] text-zinc-300 hover:bg-white/5 disabled:opacity-50">Edit message</button><button type="button" onClick={confirm} disabled={submitting} className="inline-flex min-h-10 items-center gap-2 bg-white px-4 font-mono text-[10px] font-bold uppercase tracking-[.12em] text-black hover:bg-zinc-200 disabled:opacity-50">{submitting ? <LoaderCircle size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}Confirm &amp; send</button></div></section>}
        </section>
      </div>
    </main>
  );
}
