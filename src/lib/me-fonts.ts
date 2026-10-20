export const ME_FONT_OPTIONS = [
  { value: 'outfit', label: 'Outfit Studio', description: 'The existing bold editorial display style.' },
  { value: 'geist-sans', label: 'Geist Sans', description: 'Vercel’s clean, modern sans-serif.' },
  { value: 'geist-mono', label: 'Geist Mono', description: 'A technical monospace display style.' },
  { value: 'geist-pixel', label: 'Geist Pixel', description: 'A compact pixel display style.' },
  { value: 'inter', label: 'Inter', description: 'A precise, neutral interface display style.' },
  { value: 'space-mono', label: 'Space Mono', description: 'A compact engineering and systems style.' },
  { value: 'instrument-serif', label: 'Instrument Serif', description: 'An expressive editorial serif display style.' },
] as const;

export type MeFontId = (typeof ME_FONT_OPTIONS)[number]['value'];

const fontFamilies: Record<MeFontId, string> = {
  outfit: 'var(--font-outfit)',
  'geist-sans': 'var(--font-geist-sans)',
  'geist-mono': 'var(--font-geist-mono)',
  'geist-pixel': 'var(--font-geist-pixel-square)',
  inter: 'var(--font-sans)',
  'space-mono': 'var(--font-mono)',
  'instrument-serif': 'var(--font-accent)',
};

export function isMeFontId(value: unknown): value is MeFontId {
  return typeof value === 'string' && ME_FONT_OPTIONS.some((font) => font.value === value);
}

export function getMeDisplayFont(value: unknown): string {
  return fontFamilies[isMeFontId(value) ? value : 'outfit'];
}
