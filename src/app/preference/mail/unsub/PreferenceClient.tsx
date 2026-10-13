'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, LoaderCircle, MailMinus, ShieldCheck, TriangleAlert } from 'lucide-react';
import { UNSUBSCRIBE_PATH, type PreferenceResult } from '@/lib/unsubscribe-core';
type State = PreferenceResult['state'] | 'error' | 'loading';
export default function PreferenceClient({ token = '', initial }: { token?: string; initial: PreferenceResult | { state: 'error' } }) {
  const [state, setState] = useState<State>(initial.state);
  const [message, setMessage] = useState('');
  const [isTest, setTest] = useState('isTest' in initial && Boolean(initial.isTest));
  const pending = useRef(false);
  useEffect(() => {
    if (window.location.pathname !== UNSUBSCRIBE_PATH) window.history.replaceState(window.history.state, '', UNSUBSCRIBE_PATH);
  }, []);
  const unsubscribe = async () => {
    if (!token || pending.current) return;
    pending.current = true; setState('loading'); setMessage('');
    try {
      const response = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }),
        credentials: 'same-origin', referrerPolicy: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(25000),
      });
      const result = await response.json() as { state?: string; message?: string; isTest?: boolean };
      setState(result.state && ['unavailable','unsubscribed','test_confirmed','error'].includes(result.state) ? result.state as State : 'error');
      setTest(Boolean(result.isTest)); setMessage(typeof result.message === 'string' ? result.message : '');
    } catch { setState('error'); setMessage('The connection was interrupted. Please try again; your link is safe to retry.'); }
    finally { pending.current = false; }
  };
  const complete = state === 'unsubscribed' || state === 'test_confirmed';
  const title = state === 'test_confirmed' ? 'The link works.' : complete ? 'A quieter inbox.' : state === 'unavailable' ? 'This link is unavailable.' : 'Your inbox. Your rules.';
  const description = message || (state === 'test_confirmed' ? 'This test completed without changing newsletter membership.' : complete ? 'You’re unsubscribed from avrxt newsletter broadcasts. Thanks for being part of the journey.' : state === 'unavailable' ? 'Open the complete unsubscribe link from an avrxt email. Your email address and subscription details stay private.' : state === 'error' ? 'We couldn’t load your preferences right now. Please try again.' : isTest ? 'This is a test link. Confirming it checks the flow without changing newsletter membership.' : 'If the newsletter is no longer for you, you can leave with one click below. Opening this page won’t change your subscription.');
  return <section className="newsletter-confirmation mx-auto max-w-6xl px-5 pb-24 pt-32 sm:px-8 sm:pt-44">
    <div className="confirmation-heading"><span className="confirmation-eyebrow"><span className="confirmation-dot" /> AVRXT / EMAIL PREFERENCES</span><span className="confirmation-step">{complete ? 'COMPLETE' : 'YOU’RE IN CONTROL'}</span></div>
    <div className="confirmation-grid">
      <div className="confirmation-copy"><p className="confirmation-eyebrow">A BETTER SIGNAL. ON YOUR TERMS.</p><h1>{title}</h1><p className="confirmation-description" aria-live="polite">{description}</p><div className="confirmation-promises"><span><Check size={15} /> No sign-in needed</span><span><Check size={15} /> Your choice, respected</span></div><Link href="/privacy" className="confirmation-about">How your data is handled <ArrowRight size={14} /></Link></div>
      <div className={`confirmation-card ${complete ? 'is-confirmed' : ''}`}>
        <div className="confirmation-card-top"><span className="confirmation-eyebrow">NEWSLETTER PREFERENCES</span><ShieldCheck size={17} /></div>
        <div className="confirmation-orbit" aria-hidden="true"><span /><span /><div>{complete ? <Check size={34} /> : state === 'error' || state === 'unavailable' ? <TriangleAlert size={30} /> : <MailMinus size={32} />}</div></div>
        <div className="confirmation-card-copy" role="status" aria-live="polite"><h2>{state === 'test_confirmed' ? 'Test confirmed' : complete ? 'You’re unsubscribed' : state === 'loading' ? 'Updating preferences…' : state === 'unavailable' ? 'Use your private email link' : isTest ? 'Verify the test link' : 'Leave the mailing list?'}</h2><p>{complete ? 'You can close this page or explore the website.' : state === 'unavailable' ? 'Missing and invalid links never change anyone’s subscription.' : isTest ? 'This is a safe test. Newsletter membership stays unchanged.' : 'Confirm below to stop avrxt newsletter broadcasts. This does not delete your other data.'}</p></div>
        {complete || state === 'unavailable' ? <Link href="/" className="confirmation-button">Return to avrxt.dev <ArrowRight size={17} /></Link> : <button type="button" className="confirmation-button" onClick={unsubscribe} disabled={state === 'loading'}>{state === 'loading' ? <><LoaderCircle size={17} className="confirmation-spinner" /> Updating…</> : <>{state === 'error' ? 'Try again' : isTest ? 'Confirm test link' : 'Unsubscribe'} <ArrowRight size={17} /></>}</button>}
        <p className="confirmation-security"><ShieldCheck size={13} /> Private link · Explicit confirmation</p>
      </div>
    </div>
    <div className="confirmation-footer"><span>NO PRESSURE. NO EXTRA STEPS.</span><Link href="/">AVRXT.DEV <ArrowRight size={12} /></Link></div>
  </section>;
}
