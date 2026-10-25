'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

type Scope = 'admin' | 'guestbook';
type TurnstileOptions = {
  sitekey: string;
  action: string;
  theme: 'dark';
  size: 'flexible';
  callback: (token: string) => void;
  'expired-callback': () => void;
  'error-callback': () => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileOptions) => string;
      remove: (widgetId: string) => void;
    };
  }
}

const sites: Record<Scope, { siteKey?: string; action: string }> = {
  admin: { siteKey: process.env.NEXT_PUBLIC_TURNSTILE_ADMIN_SITE_KEY, action: 'admin_login' },
  guestbook: { siteKey: process.env.NEXT_PUBLIC_TURNSTILE_GUESTBOOK_SITE_KEY, action: 'guestbook_write' },
};

export function turnstileClientEnabled(scope: Scope) {
  return Boolean(sites[scope].siteKey);
}

export default function Turnstile({ scope, onTokenChange, onError }: { scope: Scope; onTokenChange: (token: string | null) => void; onError?: () => void }) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const callbacks = useRef({ onTokenChange, onError });
  const [loaded, setLoaded] = useState(false);
  const config = sites[scope];

  useEffect(() => {
    callbacks.current = { onTokenChange, onError };
  }, [onError, onTokenChange]);

  useEffect(() => {
    if (window.turnstile) {
      setLoaded(true);
      return;
    }

    const pollForTurnstile = window.setInterval(() => {
      if (!window.turnstile) return;
      window.clearInterval(pollForTurnstile);
      setLoaded(true);
    }, 100);

    return () => window.clearInterval(pollForTurnstile);
  }, []);

  useEffect(() => {
    if (!loaded || !config.siteKey || !container.current || !window.turnstile || widgetId.current) return;
    widgetId.current = window.turnstile.render(container.current, {
      sitekey: config.siteKey,
      action: config.action,
      theme: 'dark',
      size: 'flexible',
      callback: (token) => callbacks.current.onTokenChange(token),
      'expired-callback': () => callbacks.current.onTokenChange(null),
      'error-callback': () => { callbacks.current.onTokenChange(null); callbacks.current.onError?.(); },
    });
    return () => {
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [config.action, config.siteKey, loaded]);

  if (!config.siteKey) return null;
  return <><Script id="cloudflare-turnstile" src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onLoad={() => setLoaded(true)} /><div ref={container} className="min-h-[65px]" /></>;
}
