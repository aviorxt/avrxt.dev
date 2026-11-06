import { SITE_NAME, SITE_URL } from './site-config';

export const SITE_TITLE = 'avrxt (aviorxt) | Independent Developer & Personal Website';
export const SITE_DESCRIPTION = 'The personal website of avrxt, also known as aviorxt and avr.xt. Independent developer in India building web applications, APIs, tools, and automation.';
export const personSchema = {
  '@type': 'Person',
  '@id': `${SITE_URL}/about#person`,
  name: 'avrxt',
  alternateName: ['aviorxt', 'avr.xt', '@aviorxt'],
  url: `${SITE_URL}/about`,
  jobTitle: 'Independent Developer and Aircraft Maintenance Engineer',
  description: 'Independent developer and aircraft maintenance engineer based in India, building web systems, APIs, tools, and automation.',
  address: { '@type': 'PostalAddress', addressCountry: 'IN' },
  knowsAbout: ['Web development', 'API development', 'Web security', 'Automation', 'Aircraft maintenance'],
  sameAs: ['https://github.com/aviorxt', 'https://www.instagram.com/aviorxt/'],
};
export const websiteSchema = {
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: `${SITE_URL}/`,
  name: SITE_NAME,
  alternateName: ['avrxt', 'aviorxt', 'avr.xt', 'avrxt.dev'],
  description: SITE_DESCRIPTION,
  inLanguage: 'en-IN',
  publisher: { '@id': personSchema['@id'] },
};

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
