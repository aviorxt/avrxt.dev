'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cookie, X } from 'lucide-react';

const CONSENT_KEY = 'avrxt_cookie_choice';

export default function CookieBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(pathname === '/' && !window.localStorage.getItem(CONSENT_KEY));
  }, [pathname]);

  const choose = (choice: 'accepted' | 'essential') => {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify({ choice, updatedAt: new Date().toISOString(), version: 1 }));
    setVisible(false);
  };

  if (!visible) return null;
  return (
    <aside role="dialog" aria-label="Cookie preferences" aria-live="polite" className="fixed inset-x-3 bottom-[max(.75rem,env(safe-area-inset-bottom))] z-[400] mx-auto max-w-3xl border border-[#292929] bg-[#080808]/95 p-4 shadow-[0_24px_90px_rgba(0,0,0,.9)] backdrop-blur-2xl sm:bottom-6 sm:p-5">
      <div className="flex gap-4">
        <div className="hidden size-10 shrink-0 place-items-center border border-[#292929] bg-black text-[#BCBCBC] sm:grid"><Cookie size={17} /></div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-start justify-between gap-4"><h2 className="font-mono text-xs font-bold uppercase tracking-[.18em] text-white">A small cookie note</h2><button type="button" onClick={() => choose('essential')} aria-label="Use essential storage only and close" className="text-[#858585] hover:text-white"><X size={16} /></button></div>
          <p className="text-xs leading-6 text-[#A3A3A3]">avrxt.dev uses essential storage for security, sign-in, and your consent choice. There is no advertising cookie in this build. Optional third-party embeds load only when you open those features.</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => choose('accepted')} className="min-h-10 bg-white px-4 font-mono text-[9px] font-bold uppercase tracking-[.16em] text-black">Accept</button>
            <button type="button" onClick={() => choose('essential')} className="min-h-10 border border-[#292929] bg-black px-4 font-mono text-[9px] uppercase tracking-[.16em] text-[#D0D0D0]">Essential only</button>
            <Link href="/legal/privacy#cookies" className="ml-auto min-h-10 py-3 font-mono text-[9px] uppercase tracking-[.16em] text-[#858585] underline decoration-[#484848] underline-offset-4 hover:text-white">Privacy details</Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
