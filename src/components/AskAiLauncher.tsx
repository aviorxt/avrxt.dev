'use client';

import { lazy, Suspense, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';

const AskAi = lazy(() => import('./AskAi'));

function isExcluded(pathname: string) {
  return pathname === '/'
    || pathname === '/subscribe/confirm'
    || pathname.startsWith('/delete-request')
    || pathname === '/contact/confirm'
    || pathname.startsWith('/preference/mail/unsub')
    || pathname.startsWith('/preferance/mail/unsub');
}

export default function AskAiLauncher() {
  const pathname = usePathname();
  const [opened, setOpened] = useState(false);

  if (isExcluded(pathname)) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpened(true)}
        aria-label="Ask AI about this page"
        aria-haspopup="dialog"
        className="group fixed bottom-4 right-3 z-[320] flex h-9 items-center gap-1.5 overflow-hidden rounded-full border border-white/15 bg-[#080808]/95 px-3 text-[10px] font-medium text-white shadow-[0_14px_45px_rgba(0,0,0,0.5)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-[#121212] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E5E5E5] active:scale-[.97] sm:bottom-5 sm:right-5"
      >
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        <Sparkles className="relative size-3 text-[#D0D0D0]" aria-hidden="true" />
        <span className="relative">Ask AI</span>
        <span className="relative size-1 rounded-full bg-white shadow-[0_0_8px_1px_rgba(255,255,255,0.35)]" />
      </button>
      {opened && <Suspense fallback={null}><AskAi initialOpen /></Suspense>}
    </>
  );
}
