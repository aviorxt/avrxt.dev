'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Check, Copy, Sparkles, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

type PageContext = {
  title: string;
  description: string;
  url: string;
};

type Provider = {
  name: string;
  mark: string;
  url: string;
  canPrefill?: boolean;
};

const providers: Provider[] = [
  { name: 'ChatGPT', mark: 'GPT', url: 'https://chatgpt.com/', canPrefill: true },
  { name: 'Gemini', mark: 'GEM', url: 'https://gemini.google.com/app' },
  { name: 'Claude', mark: 'CLD', url: 'https://claude.ai/new' },
  { name: 'Grok', mark: 'GRK', url: 'https://grok.com/' },
];

const quickQuestions = [
  'Summarize this page',
  'Explain it simply',
  'What are the key points?',
  'What should I pay attention to?',
];

const defaultQuestion = 'What is on this page? Summarize the key points.';

function readPageContext(pathname: string): PageContext {
  const description = document
    .querySelector<HTMLMetaElement>('meta[name="description"]')
    ?.content.trim();

  return {
    title: document.title.replace(/\s*[|·]\s*avrxt.*$/i, '').trim() || 'avrxt.dev',
    description: description || 'A page on avrxt.dev.',
    url: `https://avrxt.dev${pathname === '/' ? '' : pathname}`,
  };
}

function makePrompt(context: PageContext, question: string) {
  return [
    'Help me understand this avrxt.dev page.',
    '',
    `Page title: ${context.title}`,
    `Page description: ${context.description}`,
    `Page URL: ${context.url}`,
    '',
    `My question: ${question.trim() || defaultQuestion}`,
    '',
    'Use the public page as context. If you cannot access it, ask me to paste the relevant content. Do not invent details that are not on the page.',
  ].join('\n');
}

export default function AskAi() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState(defaultQuestion);
  const [copied, setCopied] = useState(false);
  const [context, setContext] = useState<PageContext>({
    title: 'avrxt.dev',
    description: 'A page on avrxt.dev.',
    url: 'https://avrxt.dev',
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setOpen(false);
    setCopied(false);
    const frame = window.requestAnimationFrame(() => setContext(readPageContext(pathname)));
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    setContext(readPageContext(pathname));
    const timer = window.setTimeout(() => textareaRef.current?.focus(), 180);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, pathname]);

  const prompt = useMemo(() => makePrompt(context, question), [context, question]);

  const copyPrompt = () => {
    if (!navigator.clipboard) return;
    void navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    });
  };

  const openProvider = (provider: Provider) => {
    const destination = provider.canPrefill
      ? `${provider.url}?q=${encodeURIComponent(prompt)}`
      : provider.url;

    window.open(destination, '_blank', 'noopener,noreferrer');
    copyPrompt();
  };

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ask AI about this page"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="group fixed bottom-5 right-4 z-[320] flex h-12 items-center gap-2 overflow-hidden rounded-full border border-white/15 bg-[#080808]/95 px-4 text-sm font-medium text-white shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl transition-colors hover:border-white/30 hover:bg-[#121212] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E5E5E5] sm:bottom-6 sm:right-6"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
      >
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        <Sparkles className="relative size-4 text-[#D0D0D0]" aria-hidden="true" />
        <span className="relative">Ask AI</span>
        <span className="relative size-1.5 rounded-full bg-white shadow-[0_0_10px_2px_rgba(255,255,255,0.35)]" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Close Ask AI"
              className="fixed inset-0 z-[330] cursor-default bg-black/55 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="ask-ai-title"
              className="fixed inset-x-3 bottom-3 z-[340] max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-[1.75rem] border border-white/15 bg-[#080808]/98 p-4 text-white shadow-[0_30px_100px_rgba(0,0,0,0.8)] backdrop-blur-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[430px] sm:p-5"
              initial={{ opacity: 0, y: 28, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            >
              <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.05]">
                    <Sparkles className="size-4 text-[#DEDEDE]" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#858585]">Page-aware handoff</p>
                    <h2 id="ask-ai-title" className="mt-0.5 text-lg font-semibold tracking-tight">Ask AI about this page</h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="grid size-9 shrink-0 place-items-center rounded-full border border-white/10 text-[#A3A3A3] transition hover:border-white/25 hover:bg-white/[0.06] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E5E5E5]"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-white/[0.08] bg-[#121212] p-3.5">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#858585]">
                  <span className="size-1.5 rounded-full bg-[#BCBCBC]" />
                  Current page
                </div>
                <p className="mt-2 line-clamp-1 text-sm font-medium text-[#F7F7F7]">{context.title}</p>
                <p className="mt-1 truncate font-mono text-[11px] text-[#686868]">{context.url}</p>
              </div>

              <label htmlFor="ask-ai-question" className="mt-4 block text-xs font-medium text-[#BCBCBC]">What do you want to know?</label>
              <textarea
                ref={textareaRef}
                id="ask-ai-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value.slice(0, 500))}
                rows={3}
                maxLength={500}
                className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm leading-6 text-white placeholder:text-[#484848] focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/[0.06]"
                placeholder="Ask about the content on this page…"
              />

              <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {quickQuestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setQuestion(item)}
                    className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] text-[#A3A3A3] transition hover:border-white/20 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E5E5E5]"
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {providers.map((provider) => (
                  <button
                    key={provider.name}
                    type="button"
                    onClick={() => openProvider(provider)}
                    className="group flex items-center justify-between rounded-2xl border border-white/10 bg-[#121212] px-3 py-3 text-left transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-[#1F1F1F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E5E5E5]"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="grid size-8 place-items-center rounded-xl border border-white/10 bg-black font-mono text-[9px] tracking-wider text-[#D0D0D0]">{provider.mark}</span>
                      <span className="text-sm font-medium">{provider.name}</span>
                    </span>
                    <ArrowUpRight className="size-3.5 text-[#686868] transition group-hover:text-white" aria-hidden="true" />
                  </button>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.08] pt-3">
                <p className="max-w-[255px] text-[10px] leading-4 text-[#686868]">
                  Nothing is shared until you choose a provider. The prompt is copied so you can paste it if needed.
                </p>
                <button
                  type="button"
                  onClick={copyPrompt}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-[11px] text-[#BCBCBC] transition hover:border-white/25 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E5E5E5]"
                >
                  {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
                  {copied ? 'Copied' : 'Copy prompt'}
                </button>
              </div>
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
