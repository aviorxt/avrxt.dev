export const ME_THEME_OPTIONS = [
  { value: 'primary', label: 'Primary / Noir grid', description: 'The original AVRXT monochrome system.' },
  { value: 'lunar', label: 'Lunar / Violet glass', description: 'Soft violet light, glass panels, and rounded forms.' },
  { value: 'editorial', label: 'Editorial / Paper', description: 'A warm high-contrast reading layout with ink details.' },
  { value: 'sunset', label: 'Sunset / Copper', description: 'A warm copper atmosphere with layered, elevated cards.' },
  { value: 'signal', label: 'Signal / Cyan terminal', description: 'Sharp cyan instrumentation with a dense terminal grid.' },
] as const;

export type MeThemeId = (typeof ME_THEME_OPTIONS)[number]['value'];

export function isMeThemeId(value: unknown): value is MeThemeId {
  return typeof value === 'string' && ME_THEME_OPTIONS.some((theme) => theme.value === value);
}
