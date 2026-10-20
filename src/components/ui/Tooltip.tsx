'use client';

import { cloneElement, type ReactElement, useId } from 'react';

type TooltipProps = {
  label: string;
  children: ReactElement<{ 'aria-describedby'?: string }>;
};

/**
 * A small, keyboard-accessible tooltip using the compact pop-in motion style
 * popularized by Popply Library. It is intentionally CSS-only so it adds no
 * runtime work and honours reduced-motion preferences.
 */
export function Tooltip({ label, children }: TooltipProps) {
  const id = useId();

  return (
    <span className="group/tooltip relative inline-flex">
      {cloneElement(children, { 'aria-describedby': id })}
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+0.55rem)] left-1/2 z-50 w-max max-w-48 -translate-x-1/2 translate-y-1 scale-95 rounded-md border border-white/15 bg-zinc-950 px-2 py-1 font-mono text-[8px] uppercase tracking-[.12em] text-zinc-200 opacity-0 shadow-xl shadow-black/50 transition-[opacity,transform] duration-150 group-hover/tooltip:translate-y-0 group-hover/tooltip:scale-100 group-hover/tooltip:opacity-100 group-focus-within/tooltip:translate-y-0 group-focus-within/tooltip:scale-100 group-focus-within/tooltip:opacity-100 motion-reduce:transition-none"
      >
        {label}
      </span>
    </span>
  );
}
