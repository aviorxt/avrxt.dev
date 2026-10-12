'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Check, CheckCheck, Clock3, LoaderCircle, Mail, ShieldCheck, TriangleAlert } from 'lucide-react';

type State = 'ready' | 'loading' | 'confirmed' | 'expired' | 'unavailable' | 'error';
export default function ConfirmationClient({ token, initialState }: { token: string; initialState: 'ready' | 'expired' | 'unavailable' | 'error' }) {
  const [state, setState] = useState<State>(initialState);
  const [message, setMessage] = useState('');
  const pending = useRef(false);
  useEffect(() => {
    // Retain the token only in this page’s memory; don’t leave it in copyable
    // URLs, analytics, or links to third-party services.
    const url = new URL(window.location.href);
    if (url.searchParams.has('token')) {
      url.searchParams.delete('token');
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    }
  }, []);
  const confirm = async () => {
    if (!token || pending.current) return;
    pending.current = true; setState('loading'); setMessage('');
    try {
      const response = await fetch('/api/subscribe/confirm', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }),
        credentials: 'same-origin', referrerPolicy: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(25000),
      });
      const result = await response.json() as { state?: string; message?: string };
      const next = result.state && ['confirmed', 'expired', 'unavailable', 'error'].includes(result.state) ? result.state as State : 'error';
      setState(next); setMessage(typeof result.message === 'string' ? result.message : 'Please try again shortly.');
    } catch {
      setState('error'); setMessage('The connection was interrupted. Please try again; your confirmation link has not been lost.');
    } finally { pending.current = false; }
  };
  const success = state === 'confirmed';
  const invalid = state === 'expired' || state === 'unavailable';
  const title = success ? 'You’re on the list.' : state === 'expired' ? 'A fresh link awaits.' : state === 'unavailable' ? 'Let’s try a new link.' : state === 'error' ? 'One small interruption.' : 'One click. Stay in the loop.';
  const description = message || (state === 'error' ? 'We couldn’t check your link right now. Please try confirmation again.' : invalid ? 'This confirmation link is missing, already used, or no longer available. If you already confirmed, you’re subscribed. Otherwise, request a new email.' : 'Confirm your email to receive thoughtful updates on what I’m building, technical notes, and ideas worth sharing.');
  return (
    <section className="newsletter-confirmation mx-auto max-w-6xl px-5 pb-24 pt-32 sm:px-8 sm:pt-44">
      <div className="confirmation-heading"><Link href="/subscribe" className="confirmation-eyebrow"><span className="confirmation-dot" /> AVRXT / NEWSLETTER</Link><span className="confirmation-step">{success ? 'COMPLETE' : 'EMAIL VERIFICATION'}</span></div>
      <div className="confirmation-grid">
        <div className="confirmation-copy">
          <p className="confirmation-eyebrow">{success ? 'THE SIGNAL IS CONNECTED' : 'A BETTER SIGNAL. LESS NOISE.'}</p>
          <h1>{title}</h1>
          <p className="confirmation-description">{description}</p>
          <div className="confirmation-promises"><span><Check size={15} /> Thoughtful updates</span><span><Check size={15} /> Unsubscribe anytime</span></div>
          <Link href="/about" className="confirmation-about">Built and written by aviorxt <ArrowUpRight size={14} /></Link>
        </div>
        <div className={`confirmation-card ${success ? 'is-confirmed' : ''}`}>
          <div className="confirmation-card-top"><span className="confirmation-eyebrow">{success ? 'TRANSMISSION CONNECTED' : 'YOUR SUBSCRIPTION'}</span><ShieldCheck size={17} /></div>
          <div className="confirmation-orbit" aria-hidden="true"><span /><span /><div>{success ? <CheckCheck size={34} /> : invalid ? <Clock3 size={32} /> : state === 'error' ? <TriangleAlert size={30} /> : <Mail size={32} />}</div></div>
          <div className="confirmation-card-copy" aria-live="polite" role="status"><h2>{success ? 'Email confirmed' : state === 'loading' ? 'Connecting your signal…' : invalid ? 'A new beginning' : state === 'error' ? 'Ready when you are' : 'Confirm it’s you'}</h2><p>{success ? 'Your next update will arrive in your inbox. Thanks for being here.' : invalid ? 'Subscribe again and we’ll send a fresh link to your inbox.' : 'Your subscription starts only after you confirm. Opening this page won’t add you to the list.'}</p></div>
          {success ? <Link href="/" className="confirmation-button">Explore avrxt.dev <ArrowRight size={17} /></Link> : invalid ? <Link href="/subscribe" className="confirmation-button">Request a new link <ArrowRight size={17} /></Link> : <button type="button" disabled={state === 'loading'} onClick={confirm} className="confirmation-button">{state === 'loading' ? <><LoaderCircle className="confirmation-spinner" size={17} /> Confirming…</> : <>{state === 'error' ? 'Try confirmation again' : 'Confirm subscription'} <ArrowRight size={17} /></>}</button>}
          <p className="confirmation-security"><ShieldCheck size={13} /> {success ? 'You control what reaches your inbox' : 'Secure link · Valid for 24 hours'}</p>
        </div>
      </div>
      <div className="confirmation-footer"><span>NO SPAM. JUST THE GOOD STUFF.</span><Link href="/privacy">Your privacy matters <ArrowUpRight size={12} /></Link></div>
    </section>
  );
}
