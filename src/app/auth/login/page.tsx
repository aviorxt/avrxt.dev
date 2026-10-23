'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, LoaderCircle, LockKeyhole, ShieldCheck } from 'lucide-react';
import Turnstile, { turnstileClientEnabled } from '@/components/Turnstile';

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="grid min-h-[100svh] place-items-center bg-[#050505] font-mono text-[10px] uppercase tracking-[.24em] text-zinc-500">Loading secure access…</div>}>
            <LoginContent />
        </Suspense>
    );
}

function LoginContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isDiscordLoading, setIsDiscordLoading] = useState(false);
    const [clientError, setClientError] = useState<string | null>(null);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const source = searchParams.get('source');
    const next = searchParams.get('next') || (source === 'admin' ? '/dashboard' : '/docs/admin');

    useEffect(() => {
        if (!source) router.replace('/');
    }, [source, router]);

    const turnstileRequired = turnstileClientEnabled('admin');

    const handleDiscordLogin = (event: React.FormEvent<HTMLFormElement>) => {
        if (turnstileRequired && !turnstileToken) {
            event.preventDefault();
            setClientError('Complete the security check before continuing.');
            return;
        }
        if (isDiscordLoading) {
            event.preventDefault();
            return;
        }
        setIsDiscordLoading(true);
        setClientError(null);
    };

    if (!source) return null;

    const error = searchParams.get('error');
    const errorMessages: Record<string, string> = {
        not_logged_in: 'Sign in with Discord to access the administrator workspace.',
        discord_required: 'Discord authentication is required.',
        metadata_missing: 'Discord identity not found.',
        unauthorized_role: 'Access denied: required role missing.',
        discord_not_member: 'Your Discord account is not a member of the configured server.',
        discord_unavailable: 'Discord membership verification is temporarily unavailable. Please retry shortly.',
        auth_configuration: 'Admin verification is not configured correctly. Check the server, role, and bot settings.',
        oauth_callback_failed: 'Discord authentication could not be completed. Please try again.',
        oauth_service_unavailable: 'The sign-in service timed out or is unavailable. Start a new Discord login; the previous link cannot be reused.',
        turnstile_required: 'Complete the security check before continuing.',
        turnstile_verification_failed: 'The security check could not be verified. Please try again.',
        turnstile_unavailable: 'The security service is temporarily unavailable. Please try again shortly.',
        cross_site_request_rejected: 'This sign-in request came from an untrusted origin. Open the AVRXT login page and try again.',
        invalid_request: 'This sign-in request was invalid. Refresh the page and try again.',
        rate_limited: 'Too many sign-in attempts. Please wait a few minutes before trying again.',
        provider_rejected: 'Discord rejected or cancelled the authorization request.',
        pkce_cookie_missing: 'The secure login cookie was lost. Start again in this same browser tab.',
        admin_session_failed: 'Admin access was verified, but the secure session could not be refreshed. Please sign in again.',
    };

    return (
        <main className="relative isolate grid min-h-[100svh] place-items-center overflow-hidden bg-[#050505] px-4 py-7 text-white sm:px-6">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:40px_40px]" />
            <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 size-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[.04] blur-[100px]" />

            <section className="relative w-full max-w-md border border-white/10 bg-[#090909]/95 p-6 shadow-2xl shadow-black/70 sm:p-8">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
                    <Link href="/" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.2em] text-zinc-500 transition hover:text-white">
                        <ArrowLeft size={14} /> AVRXT.DEV
                    </Link>
                    <span className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.16em] text-zinc-500">
                        <span className="size-1.5 rounded-full bg-emerald-300" /> Secure
                    </span>
                </div>

                <div className="mt-8 grid size-11 place-items-center border border-white/15 bg-white/[.05] text-zinc-100">
                    <LockKeyhole size={19} />
                </div>
                <p className="mt-6 font-mono text-[10px] uppercase tracking-[.24em] text-zinc-500">AVRXT / identity gateway</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-[-.055em] sm:text-4xl">Authenticate<br /><span className="text-zinc-500">with confidence.</span></h1>
                <p className="mt-4 text-sm leading-6 text-zinc-400">Use Discord to verify your identity and open a secure, time-limited AVRXT session.</p>

                {(error || clientError) && (
                    <div role="alert" className="mt-6 flex gap-3 border border-red-300/20 bg-red-300/[.07] p-4 text-sm leading-6 text-red-100">
                        <ShieldCheck className="mt-0.5 shrink-0 text-red-200" size={17} />
                        <p>{clientError || errorMessages[error || ''] || 'An authentication error occurred.'}</p>
                    </div>
                )}

                {source === 'admin' && (
                    <form action="/auth/start" method="post" onSubmit={handleDiscordLogin} className="mt-7">
                        <input type="hidden" name="provider" value="discord" />
                        <input type="hidden" name="next" value={next} />
                        <input type="hidden" name="turnstileToken" value={turnstileToken || ''} />
                        {turnstileRequired && <div className="mb-5 border border-white/10 bg-black/25 p-3"><Turnstile scope="admin" onTokenChange={setTurnstileToken} onError={() => setClientError('The security check could not load. Please refresh and try again.')} /></div>}
                        <button type="submit" disabled={isDiscordLoading || (turnstileRequired && !turnstileToken)} className="group flex min-h-14 w-full items-center justify-center gap-3 bg-white px-5 font-mono text-[11px] font-bold uppercase tracking-[.12em] text-black transition hover:bg-zinc-200 active:scale-[.99] disabled:cursor-wait disabled:opacity-70">
                            {isDiscordLoading ? <LoaderCircle size={17} className="animate-spin" /> : <DiscordIcon />}
                            {isDiscordLoading ? 'Opening Discord…' : 'Authenticate via Discord'}
                            {!isDiscordLoading && <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />}
                        </button>
                    </form>
                )}

                <p className="mt-5 text-center font-mono text-[9px] uppercase leading-5 tracking-[.14em] text-zinc-600">Discord authorization · encrypted session · 12 hour expiry</p>
            </section>
        </main>
    );
}

function DiscordIcon() {
    return <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 13.486 13.486 0 0 0-.64 1.28 17.683 17.683 0 0 0-5.751 0 14.15 14.15 0 0 0-.64-1.28.077.077 0 0 0-.08-.037 19.736 19.736 0 0 0-4.885 1.515.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>;
}
