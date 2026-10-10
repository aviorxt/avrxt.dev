import { buildPageMetadata } from '@/lib/page-metadata';
import SignatureExperience from './SignatureExperience';

export const metadata = buildPageMetadata({
  title: 'Signature — The avrxt Mark',
  description: 'A living, hand-drawn signature study for avrxt, also known as aviorxt, rendered as responsive animated vector ink.',
  keywords: ['avrxt signature', 'aviorxt signature', 'digital signature', 'animated signature', 'avrxt mark'],
  path: '/signature',
});

export default function SignaturePage() {
  return (
    <main className="signature-page relative min-h-screen overflow-x-clip bg-[#050505] px-4 pb-24 pt-28 text-white sm:px-6 sm:pb-32 sm:pt-36">
      <div className="signature-ambient pointer-events-none absolute inset-x-0 top-0 h-[52rem]" />
      <div className="relative mx-auto max-w-6xl">
        <header className="mb-12 grid gap-8 border-b border-[#1F1F1F] pb-12 sm:mb-16 sm:pb-16 lg:grid-cols-[1fr_24rem] lg:items-end">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[.3em] text-[#858585]">Identity study / 01</p>
            <h1 className="mt-6 font-outfit text-[clamp(4rem,13vw,9.5rem)] font-semibold uppercase leading-[.74] tracking-[-.085em]">
              Sign<span className="signature-outline">ature.</span>
            </h1>
          </div>
          <div className="border-l border-[#333333] pl-5">
            <p className="text-sm leading-7 text-[#A3A3A3] sm:text-base">
              A digital mark made to feel human—measured in curves, pressure, rhythm, and the small imperfections that give a name its character.
            </p>
          </div>
        </header>

        <SignatureExperience />

        <section className="mt-12 grid gap-8 border-y border-[#1F1F1F] py-10 sm:mt-16 sm:grid-cols-[.65fr_1.35fr] sm:py-14">
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[.25em] text-[#666666]">Authenticated by motion</p>
            <p className="mt-3 font-outfit text-2xl font-semibold tracking-[-.04em] text-[#F7F7F7]">Not a font. A gesture.</p>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-[#858585]">
            The signature is drawn directly in the browser as layered vector strokes. It scales without losing detail, respects reduced-motion preferences, and keeps the monochrome AVRXT palette intact on every screen.
          </p>
        </section>
      </div>
    </main>
  );
}
