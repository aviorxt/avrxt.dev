'use client';

import { useState } from 'react';
import { Check, LoaderCircle, MailX } from 'lucide-react';

export default function UnsubscribeClient({ token, alreadyUnsubscribed }: { token: string; alreadyUnsubscribed: boolean }) {
    const [complete, setComplete] = useState(alreadyUnsubscribed);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const unsubscribe = async () => {
        setBusy(true);
        setError('');
        try {
            const response = await fetch(`/api/mail/unsubscribe/${encodeURIComponent(token)}`, { method: 'POST' });
            if (!response.ok) {
                const result = await response.json().catch(() => ({}));
                throw new Error(result.error || 'We could not update your email preferences. Please try again.');
            }
            setComplete(true);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : 'Please try again.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <main className="grid min-h-screen place-items-center bg-[#070707] px-5 py-12 text-white">
            <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.03] p-7 text-center shadow-2xl sm:p-10">
                <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/5 text-zinc-300">{complete ? <Check size={23} /> : <MailX size={23} />}</div>
                <div className="mb-3 text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">avrxt / email preferences</div>
                <h1 className="text-2xl font-semibold tracking-tight">{!token ? 'Link unavailable' : complete ? 'You’re unsubscribed' : 'Leave the mailing list?'}</h1>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-zinc-400">{!token ? 'This unsubscribe link is invalid or expired. You can close this page.' : complete ? 'You will no longer receive avrxt newsletter broadcasts.' : 'Confirm below and we’ll stop sending avrxt newsletter broadcasts to this address.'}</p>
                {error && <p role="alert" className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-300">{error}</p>}
                {token && !complete && <button type="button" onClick={unsubscribe} disabled={busy} className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50">{busy ? <LoaderCircle size={16} className="animate-spin" /> : null}{busy ? 'Updating…' : 'Unsubscribe'}</button>}
                <p className="mt-8 text-[10px] text-zinc-600">avrxt.dev</p>
            </section>
        </main>
    );
}
