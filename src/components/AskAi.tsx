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
  logo: 'openai' | 'gemini' | 'claude' | 'grok';
  url: string;
  canPrefill?: boolean;
};

const providers: Provider[] = [
  { name: 'ChatGPT', logo: 'openai', url: 'https://chatgpt.com/', canPrefill: true },
  { name: 'Gemini', logo: 'gemini', url: 'https://gemini.google.com/app' },
  { name: 'Claude', logo: 'claude', url: 'https://claude.ai/new' },
  { name: 'Grok', logo: 'grok', url: 'https://grok.com/' },
];

const providerPaths: Record<Provider['logo'], string> = {
  openai: 'M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 00-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 01.476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 014.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 01-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 005.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.947-5.946-5.947-.642 0-1.26.095-1.88.31A5.962 5.962 0 0010.205 0a5.947 5.947 0 00-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26-.095 1.88-.309a5.96 5.96 0 004.162 1.713z',
  gemini: 'M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z',
  claude: 'M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z',
  grok: 'M9.27 15.29l7.978-5.897c.391-.29.95-.177 1.137.272.98 2.369.542 5.215-1.41 7.169-1.951 1.954-4.667 2.382-7.149 1.406l-2.711 1.257c3.889 2.661 8.611 2.003 11.562-.953 2.341-2.344 3.066-5.539 2.388-8.42l.006.007c-.983-4.232.242-5.924 2.75-9.383.06-.082.12-.164.179-.248l-3.301 3.305v-.01L9.267 15.292M7.623 16.723c-2.792-2.67-2.31-6.801.071-9.184 1.761-1.763 4.647-2.483 7.166-1.425l2.705-1.25a7.808 7.808 0 00-1.829-1A8.975 8.975 0 005.984 5.83c-2.533 2.536-3.33 6.436-1.962 9.764 1.022 2.487-.653 4.246-2.34 6.022-.599.63-1.199 1.259-1.682 1.925l7.62-6.815',
};

function ProviderLogo({ provider }: { provider: Provider }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-current" focusable="false">
      <path fillRule="evenodd" d={providerPaths[provider.logo]} />
    </svg>
  );
}

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
    title: document.title.replace(/\s*[|·]\s*avrxt.*$/i, '').trim() || 'www.avrxt.dev',
    description: description || 'A page on www.avrxt.dev.',
    url: `https://www.avrxt.dev${pathname === '/' ? '' : pathname}`,
  };
}

function makePrompt(context: PageContext, question: string) {
  return [
    'Help me understand this www.avrxt.dev page.',
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
    title: 'www.avrxt.dev',
    description: 'A page on www.avrxt.dev.',
    url: 'https://www.avrxt.dev',
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

  if (pathname === '/' || pathname === '/subscribe/confirm' || pathname.startsWith('/preference/mail/unsub') || pathname.startsWith('/preferance/mail/unsub')) return null;

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ask AI about this page"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="group fixed bottom-4 right-3 z-[320] flex h-9 items-center gap-1.5 overflow-hidden rounded-full border border-white/15 bg-[#080808]/95 px-3 text-[10px] font-medium text-white shadow-[0_14px_45px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-colors hover:border-white/30 hover:bg-[#121212] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E5E5E5] sm:bottom-5 sm:right-5"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
      >
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        <Sparkles className="relative size-3 text-[#D0D0D0]" aria-hidden="true" />
        <span className="relative">Ask AI</span>
        <span className="relative size-1 rounded-full bg-white shadow-[0_0_8px_1px_rgba(255,255,255,0.35)]" />
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
                      <span className="grid size-8 place-items-center rounded-xl border border-white/10 bg-black text-[#D0D0D0] transition-colors group-hover:text-white"><ProviderLogo provider={provider} /></span>
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
