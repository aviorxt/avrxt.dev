export const ME_THEME_OPTIONS = [
  { value: 'primary', label: 'Primary / Noir grid', description: 'The original AVRXT monochrome system.' },
  { value: 'lunar', label: 'Lunar / Violet glass', description: 'Soft violet light, glass panels, and rounded forms.' },
  { value: 'editorial', label: 'Editorial / Paper', description: 'A warm high-contrast reading layout with ink details.' },
  { value: 'sunset', label: 'Sunset / Copper', description: 'A warm copper atmosphere with layered, elevated cards.' },
  { value: 'signal', label: 'Signal / Cyan terminal', description: 'Sharp cyan instrumentation with a dense terminal grid.' },
  { value: 'ocean', label: 'Ocean / Deep current', description: 'Fluid blue depth, soft glass, and wave-like surfaces.' },
  { value: 'botanical', label: 'Botanical / Moss studio', description: 'Organic green tones, warm paper, and natural rounded details.' },
  { value: 'neon', label: 'Neon / Arcade', description: 'Electric magenta and cyan with pixel-inspired interface details.' },
  { value: 'christmas', label: 'Christmas / Winter lodge', description: 'Evergreen, candlelight, snow, and festive red accents.' },
  { value: 'new-year', label: 'New Year / Midnight gold', description: 'Midnight blue, champagne gold, and celebratory light trails.' },
  { value: 'gallery', label: 'Gallery / Art wall', description: 'An off-white editorial gallery with asymmetric image-led cards.' },
  { value: 'orbit', label: 'Orbit / Space station', description: 'A deep-space control room with circular HUD elements and telemetry motion.' },
  { value: 'brutalist', label: 'Brutalist / Poster', description: 'A high-contrast print poster with loud type, blocks, and hard edges.' },
  { value: 'studio', label: 'Studio / Soft product', description: 'A calm, tactile product layout with floating panels and restrained color.' },
  { value: 'kinetic', label: 'Kinetic / Motion tape', description: 'A kinetic black-and-lime layout with marquee details and angular cards.' },
] as const;

export type MeThemeId = (typeof ME_THEME_OPTIONS)[number]['value'];

export function isMeThemeId(value: unknown): value is MeThemeId {
  return typeof value === 'string' && ME_THEME_OPTIONS.some((theme) => theme.value === value);
}
