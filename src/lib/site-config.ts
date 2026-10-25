export const SITE_URL = 'https://www.avrxt.dev';
export const SITE_NAME = 'AVRXT.DEV';
export const SITE_LOCALE = 'en_IN';

export function absoluteSiteUrl(path = '/') {
  return new URL(path, SITE_URL).toString();
}
