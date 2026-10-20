export const ME_FONT_OPTIONS = [
  { value: 'outfit', label: 'Outfit Studio', description: 'The existing bold editorial display style.' },
  { value: 'geist-sans', label: 'Geist Sans', description: 'Vercel’s clean, modern sans-serif.' },
  { value: 'geist-mono', label: 'Geist Mono', description: 'A technical monospace display style.' },
  { value: 'geist-pixel', label: 'Geist Pixel', description: 'A compact pixel display style.' },
] as const;

export type MeFontId = (typeof ME_FONT_OPTIONS)[number]['value'];

const fontFamilies: Record<MeFontId, string> = {
  outfit: 'var(--font-outfit)',
  'geist-sans': 'var(--font-geist-sans)',
  'geist-mono': 'var(--font-geist-mono)',
  'geist-pixel': 'var(--font-geist-pixel-square)',
};

export function isMeFontId(value: unknown): value is MeFontId {
  return typeof value === 'string' && ME_FONT_OPTIONS.some((font) => font.value === value);
}

export function getMeDisplayFont(value: unknown): string {
  return fontFamilies[isMeFontId(value) ? value : 'outfit'];
}
