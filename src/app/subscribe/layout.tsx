import { isNewsletterEnabled } from '@/lib/public-feature-config';

export const dynamic = 'force-dynamic';

export default async function SubscribeLayout({ children }: { children: React.ReactNode }) {
  if (await isNewsletterEnabled()) return children;
  return <main className="grid min-h-screen place-items-center bg-black px-6 text-center text-white"><section className="max-w-lg border border-white/10 bg-zinc-950 p-8"><p className="font-mono text-[10px] uppercase tracking-[.28em] text-zinc-500">AVRXT / Newsletter</p><h1 className="mt-5 text-3xl font-bold uppercase">Signups unavailable</h1><p className="mt-3 text-sm leading-6 text-zinc-400">Newsletter signups are currently disabled.</p></section></main>;
}
