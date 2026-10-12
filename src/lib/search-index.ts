import 'server-only';
import { randomUUID } from 'node:crypto';
import { createPublicClient } from '@/utils/supabase/public';
import { configuredRedis } from '@/lib/redis-rest';
import { PUBLIC_SEARCH_PAGES, documentSearchRecord, validSearchConfig, type SearchRecord } from '@/lib/site-search';
import type { DocArticle } from '@/lib/docs-config';

function indexConfig() {
  const config = { appId: process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '', index: process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || '', key: process.env.ALGOLIA_WRITE_KEY || '' };
  if (!validSearchConfig(config)) throw new Error('Search indexing is not configured');
  return config;
}
async function api(path: string, body?: unknown, method = 'POST') {
  const config = indexConfig();
  const response = await fetch(`https://${config.appId}.algolia.net/1/indexes/${config.index}${path}`, {
    method, headers: { 'Content-Type': 'application/json', 'X-Algolia-Application-Id': config.appId, 'X-Algolia-API-Key': config.key },
    body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`Search indexing HTTP ${response.status}`);
  return response.json();
}
async function waitTask(taskID: number) {
  for (let attempt = 0; attempt < 15; attempt++) {
    const task = await api(`/task/${taskID}`, undefined, 'GET');
    if (task.status === 'published') return;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('Search indexing task timed out');
}
type IndexRequest = { action: 'addObject' | 'deleteObject'; body: SearchRecord | { objectID: string } };
async function batch(requests: IndexRequest[]) {
  for (let start = 0; start < requests.length; start += 100) {
    const task = await api('/batch', { requests: requests.slice(start, start + 100) });
    await waitTask(task.taskID);
  }
}
async function withIndexLock<T>(operation: () => Promise<T>) {
  const redis = configuredRedis();
  if (!redis) throw new Error('Search indexing lock is not configured');
  const config = indexConfig();
  // Shared across deployments: Preview reads the Production public index but cannot write it.
  const key = `avrxt:algolia:${config.appId}:${config.index}:lock`;
  const token = randomUUID();
  const locked = await redis.command('SET', key, token, 'NX', 'EX', 120);
  if (locked !== 'OK') throw new Error('Search indexing is busy');
  try { return await operation(); }
  finally { await redis.command('EVAL', 'if redis.call("GET",KEYS[1]) == ARGV[1] then return redis.call("DEL",KEYS[1]) else return 0 end', 1, key, token).catch(() => {}); }
}

export async function syncPublicSearchIndex() {
  if (process.env.VERCEL_ENV === 'preview') throw new Error('Only Production reconciles the public index');
  return withIndexLock(async () => {
    // Query the anonymous/RLS client directly. A database outage must not erase the index.
    const { data, error } = await createPublicClient().from('documents').select('id,slug,title,description,content,tags,published').eq('published', true).limit(5000);
    if (error || !data || data.length === 5000) throw new Error('Public search source lookup failed or exceeded its limit');
    const records = [...PUBLIC_SEARCH_PAGES, ...(data as DocArticle[]).flatMap(doc => documentSearchRecord(doc) || [])];
    const existing = new Set<string>();
    let cursor: string | undefined;
    for (let page = 0; page < 20; page++) {
      const result = await api('/browse', cursor ? { cursor } : { attributesToRetrieve: ['objectID'], hitsPerPage: 1000 });
      for (const hit of result.hits || []) if (typeof hit.objectID === 'string') existing.add(hit.objectID);
      cursor = result.cursor;
      if (!cursor) break;
    }
    if (cursor) throw new Error('Public search index exceeded its limit');
    const settings = await api('/settings', { searchableAttributes: ['title', 'unordered(keywords)', 'description', 'content', 'href'], attributesToRetrieve: ['title', 'description', 'href', 'category'], attributesToHighlight: [], attributesToSnippet: [], typoTolerance: true, hitsPerPage: 10 }, 'PUT');
    await waitTask(settings.taskID);
    const ids = new Set(records.map(record => record.objectID));
    await batch([
      ...Array.from(existing).filter(id => !ids.has(id)).map(objectID => ({ action: 'deleteObject' as const, body: { objectID } })),
      ...records.map(body => ({ action: 'addObject' as const, body })),
    ]);
    return { records: records.length, removed: Array.from(existing).filter(id => !ids.has(id)).length };
  });
}

export async function syncSearchDocument(id: string) {
  if (!process.env.ALGOLIA_WRITE_KEY || process.env.VERCEL_ENV === 'preview') return;
  try {
    await withIndexLock(async () => {
      const { data, error } = await createPublicClient().from('documents').select('id,slug,title,description,content,tags,published').eq('id', id).eq('published', true).maybeSingle();
      if (error) throw new Error('Public search source lookup failed');
      const record = data ? documentSearchRecord(data as DocArticle) : null;
      await batch([record ? { action: 'addObject', body: record } : { action: 'deleteObject', body: { objectID: `doc:${id}` } }]);
    });
  } catch { console.warn('Public search update deferred to the daily reconciliation.'); }
}
