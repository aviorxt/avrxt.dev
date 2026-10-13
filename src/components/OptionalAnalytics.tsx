'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

const Analytics = dynamic(() => import('@vercel/analytics/next').then(module => module.Analytics), { ssr: false });
const SpeedInsights = dynamic(() => import('@vercel/speed-insights/next').then(module => module.SpeedInsights), { ssr: false });

export default function OptionalAnalytics() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const read = () => {
      try { setEnabled(JSON.parse(localStorage.getItem('avrxt_cookie_choice') || '{}').choice === 'accepted'); }
      catch { setEnabled(false); }
    };
    read(); window.addEventListener('avrxt-cookie-choice', read);
    return () => window.removeEventListener('avrxt-cookie-choice', read);
  }, []);
  return enabled && pathname !== '/subscribe/confirm' && !pathname.startsWith('/delete-request') && pathname !== '/contact/confirm' && !pathname.startsWith('/preference/mail/unsub') && !pathname.startsWith('/preferance/mail/unsub') ? <><Analytics /><SpeedInsights /></> : null;
}
