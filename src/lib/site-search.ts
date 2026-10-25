import { TERMINAL_PAGES } from './terminal';
import { tools } from './tool-catalog';
import type { DocArticle } from './docs-config';

export type SearchRecord = { objectID: string; title: string; description: string; href: string; category: string; content?: string; keywords?: string };
export const SEARCH_QUERY_LIMIT = 120;
export const PUBLIC_SEARCH_PAGES: SearchRecord[] = [
  ...TERMINAL_PAGES.filter(page => !page.external).map(page => ({ objectID: `page:${page.href}`, title: page.title, description: page.description, href: page.href, category: page.group })),
  ...tools.map(tool => ({ objectID: `page:/tools/${tool.slug}`, title: tool.title, description: tool.description, href: `/tools/${tool.slug}`, category: 'tools' })),
];
const publicPaths = new Set(PUBLIC_SEARCH_PAGES.map(page => page.href));
export function isPublicSearchPath(value: unknown): value is string {
  return typeof value === 'string' && (publicPaths.has(value) || /^\/docs\/[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(value) && value.length <= 106 && value.toLowerCase() !== '/docs/admin');
}
export function documentSearchRecord(doc: DocArticle): SearchRecord | null {
  const href = `/docs/${doc.slug}`;
  if (!doc.published || !isPublicSearchPath(href)) return null;
  return { objectID: `doc:${doc.id}`, title: doc.title.slice(0, 160), description: (doc.description || '').slice(0, 300), href, category: 'docs',
    // Excerpts only: never upload the database record, author identity or admin metadata.
    content: (doc.content || '').replace(/<[^>]*>/g, ' ').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[`#*_>]/g, ' ').replace(/\s+/g, ' ').slice(0, 1500),
    keywords: (doc.tags || []).join(' ').slice(0, 250) };
}
export function parseSearchHits(input: unknown): SearchRecord[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  return input.slice(0, 10).flatMap(hit => {
    if (!hit || typeof hit !== 'object' || !isPublicSearchPath(hit.href) || typeof hit.title !== 'string' || seen.has(hit.href)) return [];
    seen.add(hit.href);
    return [{ objectID: hit.href, title: hit.title.slice(0, 160), href: hit.href, description: typeof hit.description === 'string' ? hit.description.slice(0, 300) : '', category: ['site', 'tools', 'docs', 'legal'].includes(hit.category) ? hit.category : 'site' }];
  });
}
export function localSearch(query: string) {
  const words = query.trim().toLowerCase().slice(0, SEARCH_QUERY_LIMIT).split(/\s+/);
  return PUBLIC_SEARCH_PAGES.filter(page => words.every(word => `${page.title} ${page.description} ${page.href}`.toLowerCase().includes(word))).slice(0, 10);
}
export type SearchConfig = { appId: string; index: string; key: string };
export function validSearchConfig(config: SearchConfig) {
  return /^[A-Z0-9]{10}$/.test(config.appId) && /^[a-zA-Z0-9_-]{1,100}$/.test(config.index) && /^[a-f0-9]{32}$/.test(config.key);
}
export async function fetchSearch(query: string, config: SearchConfig, signal: AbortSignal, request = fetch) {
  if (!validSearchConfig(config)) throw new Error('Search is unavailable');
  const response = await request(`https://${config.appId}-dsn.algolia.net/1/indexes/${config.index}/query`, {
    method: 'POST', signal, credentials: 'omit', headers: { 'Content-Type': 'application/json', 'X-Algolia-Application-Id': config.appId, 'X-Algolia-API-Key': config.key },
    body: JSON.stringify({ query: query.trim().slice(0, SEARCH_QUERY_LIMIT), hitsPerPage: 10, analytics: false, clickAnalytics: false, attributesToRetrieve: ['title', 'description', 'href', 'category'], attributesToHighlight: [], attributesToSnippet: [] }),
  });
  if (!response.ok) throw new Error('Search is unavailable');
  const data = await response.json();
  return parseSearchHits(data.hits);
}
