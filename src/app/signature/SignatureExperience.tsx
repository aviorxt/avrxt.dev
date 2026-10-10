'use client';

import { useState, type CSSProperties } from 'react';
import { PenTool, RotateCcw, Sparkles } from 'lucide-react';

const strokes = [
  {
    d: 'M64 272 C112 273 151 250 178 207 C205 164 222 94 202 69 C183 45 151 84 140 145 C126 222 158 286 218 281 C276 276 311 222 337 166',
    delay: '0s',
    duration: '1.25s',
  },
  {
    d: 'M218 278 C249 270 270 241 290 205 C306 177 320 161 337 166 C351 172 340 207 342 229 C344 251 358 260 377 247 C402 229 418 194 433 168',
    delay: '1.08s',
    duration: '.82s',
  },
  {
    d: 'M376 247 C399 238 421 209 433 168 C439 147 438 127 428 122 C415 116 402 145 402 184 C403 225 427 250 461 245 C492 240 510 214 526 181 C536 160 548 147 559 151 C572 157 555 184 557 207 C559 228 577 235 596 221',
    delay: '1.74s',
    duration: '1.05s',
  },
  {
    d: 'M525 245 C554 242 581 219 605 185 C626 156 642 139 654 146 C669 155 640 189 636 216 C632 244 651 256 677 242 C704 228 727 192 748 159 M624 156 C654 188 680 218 715 248',
    delay: '2.62s',
    duration: '1.05s',
  },
  {
    d: 'M718 244 C750 239 777 212 793 174 C810 134 818 90 804 78 C791 67 772 94 769 130 C765 180 783 228 818 239 C848 248 879 228 902 199 M742 142 C781 145 826 138 862 122',
    delay: '3.45s',
    duration: '1.02s',
  },
  {
    d: 'M80 318 C245 345 458 347 651 323 C753 311 838 291 930 246 C871 288 824 324 789 360',
    delay: '4.28s',
    duration: '1.18s',
  },
] as const;

export default function SignatureExperience() {
  const [run, setRun] = useState(0);

  return (
    <section className="signature-stage relative overflow-hidden border border-[#292929] bg-black" aria-labelledby="signature-canvas-title">
      <div className="signature-stage-grid pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/65 to-transparent" />

      <div className="relative flex flex-wrap items-center justify-between gap-4 border-b border-[#1F1F1F] px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center border border-[#333333] bg-[#080808] text-[#D0D0D0]"><PenTool size={15} /></span>
          <div>
            <h2 id="signature-canvas-title" className="font-mono text-[9px] uppercase tracking-[.24em] text-[#D0D0D0]">Live ink study</h2>
            <p className="mt-1 font-mono text-[7px] uppercase tracking-[.18em] text-[#666666]">Six strokes / one continuous identity</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setRun((value) => value + 1)}
          className="group inline-flex min-h-11 touch-manipulation items-center gap-2 border border-[#333333] bg-[#080808] px-4 font-mono text-[8px] uppercase tracking-[.2em] text-[#BCBCBC] transition-colors hover:border-[#666666] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E5E5E5]"
        >
          <RotateCcw size={13} className="transition-transform duration-500 group-hover:-rotate-180 motion-reduce:transform-none" />
          Replay ink
        </button>
      </div>

      <div className="relative grid min-h-[25rem] place-items-center px-3 py-12 sm:min-h-[34rem] sm:px-10 sm:py-16">
        <div className="signature-halo pointer-events-none absolute left-1/2 top-1/2 h-40 w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full" />
        <div key={run} className="signature-draw relative w-full max-w-5xl" role="img" aria-label="Animated handwritten signature reading avrxt">
          <svg viewBox="0 0 1000 410" className="h-auto w-full overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id={`signature-ink-${run}`} x1="70" y1="60" x2="930" y2="340" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFFFFF" />
                <stop offset=".48" stopColor="#DEDEDE" />
                <stop offset="1" stopColor="#858585" />
              </linearGradient>
              <filter id={`signature-soft-${run}`} x="-10%" y="-20%" width="120%" height="140%">
                <feGaussianBlur stdDeviation="7" />
              </filter>
            </defs>

            <g className="signature-shadow" stroke="#FFFFFF" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" opacity=".08" filter={`url(#signature-soft-${run})`}>
              {strokes.map((stroke) => <path key={stroke.d} d={stroke.d} />)}
            </g>
            <g stroke={`url(#signature-ink-${run})`} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
              {strokes.map((stroke, index) => (
                <path
                  key={stroke.d}
                  d={stroke.d}
                  pathLength="1"
                  className="signature-stroke"
                  style={{ '--signature-delay': stroke.delay, '--signature-duration': stroke.duration } as CSSProperties}
                  data-stroke={index + 1}
                />
              ))}
            </g>
          </svg>
          <span className="signature-nib pointer-events-none absolute left-[6.5%] top-[68%] size-2 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,.9)]" aria-hidden="true" />
        </div>
      </div>

      <div className="relative grid gap-px border-t border-[#1F1F1F] bg-[#1F1F1F] sm:grid-cols-3">
        {[
          ['Mark', 'avrxt / aviorxt'],
          ['Medium', 'Vector ink'],
          ['Motion', 'Reduced-motion aware'],
        ].map(([label, value]) => (
          <div key={label} className="bg-[#080808] px-5 py-4">
            <p className="font-mono text-[7px] uppercase tracking-[.22em] text-[#666666]">{label}</p>
            <p className="mt-2 text-xs text-[#D0D0D0]">{value}</p>
          </div>
        ))}
      </div>

      <Sparkles aria-hidden="true" className="pointer-events-none absolute right-5 top-24 size-4 text-[#484848] sm:right-8" />
    </section>
  );
}
