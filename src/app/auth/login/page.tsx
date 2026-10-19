'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, CheckCircle2, LoaderCircle, LockKeyhole, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="grid min-h-screen place-items-center bg-[#050505] font-mono text-[10px] uppercase tracking-[.24em] text-zinc-500">Loading secure access…</div>}>
            <LoginContent />
        </Suspense>
    );
}

function LoginContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isDiscordLoading, setIsDiscordLoading] = useState(false);
    const [clientError, setClientError] = useState<string | null>(null);
    const source = searchParams.get('source');
    const next = searchParams.get('next') || (source === 'admin' ? '/dashboard' : '/docs/admin');

    useEffect(() => {
        if (!source) {
            router.push('/');
        }
    }, [source, router]);

    const handleDiscordLogin = async () => {
        if (isDiscordLoading) return;
        setIsDiscordLoading(true);
        setClientError(null);

        // OAuth start mutates the transaction cookie. Avoid RSC/prefetch
        // navigation issuing a second start request with different state.
        window.location.assign(new URL(`/auth/start?provider=discord&next=${encodeURIComponent(next)}`, window.location.origin).toString());
    };

    if (!source) return null;

    const error = searchParams.get('error');
    const errorMessages: Record<string, string> = {
        discord_required: 'Discord authentication is required.', metadata_missing: 'Discord identity not found.', unauthorized_role: 'Access denied: required role missing.', discord_not_member: 'Your Discord account is not a member of the configured server.', discord_unavailable: 'Discord membership verification is temporarily unavailable. Please retry shortly.', auth_configuration: 'Admin verification is not configured correctly. Check the server, role, and bot settings.', oauth_callback_failed: 'Discord authentication could not be completed. Please try again.', oauth_service_unavailable: 'The sign-in service timed out or is unavailable. Start a new Discord login; the previous link cannot be reused.', provider_rejected: 'Discord rejected or cancelled the authorization request.', pkce_cookie_missing: 'The secure login cookie was lost. Start again in this same browser tab.', admin_session_failed: 'Admin access was verified, but the secure session could not be refreshed. Please sign in again.',
    };

    return (
        <main className="relative isolate grid min-h-screen overflow-hidden bg-[#050505] px-4 py-5 text-white sm:p-8">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
            <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 size-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[.045] blur-[120px]" />
            <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between"><Link href="/" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.2em] text-zinc-500 transition hover:text-white"><ArrowLeft size={14}/> avrxt.dev</Link><span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.03] px-3 py-2 font-mono text-[9px] uppercase tracking-[.16em] text-zinc-400"><span className="size-1.5 rounded-full bg-emerald-300"/> Secure session</span></header>

            <section className="relative z-10 mx-auto grid w-full max-w-5xl place-items-center py-12 sm:py-16"><div className="grid w-full overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a]/90 shadow-2xl shadow-black/70 lg:grid-cols-[1.05fr_.95fr]">
                <div className="relative overflow-hidden border-b border-white/10 p-7 sm:p-10 lg:border-b-0 lg:border-r"><div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(255,255,255,.08),transparent_38%)]"/><div className="relative"><div className="grid size-11 place-items-center rounded-xl border border-white/15 bg-white/[.06] text-zinc-100 shadow-inner shadow-white/[.04]"><LockKeyhole size={19}/></div><p className="mt-8 font-mono text-[10px] uppercase tracking-[.25em] text-zinc-500">AVRXT / identity gateway</p><h1 className="mt-4 max-w-md text-4xl font-semibold tracking-[-.06em] text-white sm:text-5xl">Secure access,<br/><span className="text-zinc-500">without the noise.</span></h1><p className="mt-5 max-w-sm text-sm leading-7 text-zinc-400">Authentication happens with Discord. AVRXT only requests the identity needed to verify access and create your secure session.</p><div className="mt-9 space-y-3 border-t border-white/10 pt-6">{['Signed session cookie', 'Role-aware administrator verification', 'No Discord password collected'].map(item => <p key={item} className="flex items-center gap-3 text-xs text-zinc-400"><CheckCircle2 size={15} className="text-zinc-300"/>{item}</p>)}</div></div></div>

                <div className="p-7 sm:p-10 lg:flex lg:flex-col lg:justify-center"><p className="font-mono text-[10px] uppercase tracking-[.22em] text-zinc-500">Restricted area</p><h2 className="mt-3 text-2xl font-semibold tracking-[-.04em]">Continue with Discord</h2><p className="mt-2 text-sm leading-6 text-zinc-500">You will return here after Discord confirms your account.</p>

                {(error || clientError) && (
                    <div role="alert" className="mt-6 flex gap-3 rounded-xl border border-red-300/20 bg-red-300/[.07] p-4 text-sm leading-6 text-red-100"><ShieldCheck className="mt-0.5 shrink-0 text-red-200" size={17}/><p>{clientError || errorMessages[error || ''] || 'An authentication error occurred.'}</p></div>
                )}

                {source === 'admin' && (
                    <button
                        onClick={handleDiscordLogin}
                        disabled={isDiscordLoading}
                        className="group relative mt-7 w-full overflow-hidden rounded-xl border border-white/15 bg-white text-black transition hover:bg-zinc-200 active:scale-[.99] disabled:cursor-wait disabled:opacity-70"
                    >
                        <div className="relative flex min-h-14 items-center justify-center gap-3 px-6 py-4">
                            {/* Discord Icon */}
                            <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-500" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 13.486 13.486 0 0 0-.64 1.28 17.683 17.683 0 0 0-5.751 0 14.15 14.15 0 0 0-.64-1.28.077.077 0 0 0-.08-.037 19.736 19.736 0 0 0-4.885 1.515.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>
                            <span className="font-mono text-[11px] font-bold tracking-[.12em] uppercase">{isDiscordLoading ? 'Opening Discord…' : 'Authenticate via Discord'}</span>{isDiscordLoading ? <LoaderCircle size={16} className="animate-spin"/> : <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"/>}
                        </div>
                    </button>
                )}
                <p className="mt-5 text-center font-mono text-[9px] uppercase tracking-[.14em] text-zinc-600">Discord authorization · encrypted session · 12 hour expiry</p></div>
            </div></section>
        </main>
    );
}
