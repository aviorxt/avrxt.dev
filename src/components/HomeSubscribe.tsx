'use client';

import { FormEvent, useState } from 'react';
import { ArrowRight, Check, LoaderCircle, Mail } from 'lucide-react';
import { apiUrl } from '@/lib/api-gateway';

type Status = { type: 'idle' | 'success' | 'error'; message: string };

export default function HomeSubscribe() {
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState<Status>({ type: 'idle', message: '' });

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        setStatus({ type: 'idle', message: '' });

        const form = event.currentTarget;
        const email = new FormData(form).get('email');

        try {
            const response = await fetch(apiUrl('/v1/subscribe', '/api/subscribe'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const payload = await response.json() as { message?: string; error?: string };
            if (!response.ok) throw new Error(payload.error?.replaceAll('_', ' ') || 'Subscription failed');
            form.reset();
            setStatus({ type: 'success', message: 'You’re on the list. Welcome to the signal.' });
        } catch (cause) {
            setStatus({ type: 'error', message: cause instanceof Error ? cause.message : 'Subscription failed. Try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="home-subscribe w-full max-w-[30rem] border border-white/15 bg-[#080808]/80 p-3 text-left backdrop-blur-xl sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[.2em] text-[#A3A3A3]"><Mail size={11} /> Monthly signal</div>
                <span className="font-mono text-[7px] uppercase tracking-[.16em] text-[#666666]">No noise / Unsubscribe anytime</span>
            </div>
            <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
                <label htmlFor="home-newsletter-email" className="sr-only">Email address</label>
                <input id="home-newsletter-email" type="email" name="email" autoComplete="email" inputMode="email" required maxLength={254} placeholder="you@example.com" className="min-h-11 min-w-0 flex-1 border border-white/10 bg-black px-3 font-mono text-[10px] text-white outline-none placeholder:text-[#484848] focus:border-white/35" />
                <button type="submit" disabled={submitting || status.type === 'success'} className="group inline-flex min-h-11 shrink-0 items-center justify-center gap-2 bg-white px-4 font-mono text-[8px] font-bold uppercase tracking-[.16em] text-black transition-colors hover:bg-[#DEDEDE] disabled:cursor-not-allowed disabled:opacity-60">
                    {submitting ? <LoaderCircle size={12} className="animate-spin" /> : status.type === 'success' ? <Check size={12} /> : <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />}
                    {submitting ? 'Joining' : status.type === 'success' ? 'Subscribed' : 'Subscribe'}
                </button>
            </form>
            <p aria-live="polite" className={`mt-2 min-h-4 font-mono text-[8px] leading-4 ${status.type === 'error' ? 'text-[#D0D0D0]' : status.type === 'success' ? 'text-white' : 'text-[#666666]'}`}>
                {status.message || 'Technical notes, new tools, and occasional project updates.'}
            </p>
        </div>
    );
}
