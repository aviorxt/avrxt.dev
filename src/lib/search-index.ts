import 'server-only';
import { randomUUID } from 'node:crypto';
import { configuredRedis } from '@/lib/redis-rest';
import { PUBLIC_SEARCH_PAGES, validSearchConfig, type SearchRecord } from '@/lib/site-search';
import { waitForSearchTask } from '@/lib/search-task';

function indexConfig() {
  const config = { appId: process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '', index: process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || '', key: process.env.ALGOLIA_WRITE_KEY || '' };
  if (!validSearchConfig(config)) throw new Error('Search indexing is not configured');
  return config;
}
async function api(path: string, body?: unknown, method = 'POST', timeoutMs = 5000) {
  const config = indexConfig();
  const response = await fetch(`https://${config.appId}.algolia.net/1/indexes/${config.index}${path}`, {
    method, headers: { 'Content-Type': 'application/json', 'X-Algolia-Application-Id': config.appId, 'X-Algolia-API-Key': config.key },
    body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(Math.max(1, Math.ceil(timeoutMs))),
  });
  if (!response.ok) throw new Error(`Search indexing HTTP ${response.status}`);
  return response.json();
}
async function waitTask(taskID: number) {
  await waitForSearchTask(timeout => api(`/task/${taskID}`, undefined, 'GET', timeout));
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
    // Documentation is indexed by Mintlify. Reconciliation removes stale CMS hits.
    const records = PUBLIC_SEARCH_PAGES;
    const existing = new Set<string>();
    let cursor: string | undefined;
    for (let page = 0; page < 20; page++) {
      const result = await api('/browse', cursor ? { cursor } : { attributesToRetrieve: ['objectID'], hitsPerPage: 1000 });
      for (const hit of result.hits || []) if (typeof hit.objectID === 'string') existing.add(hit.objectID);
      cursor = result.cursor;
      if (!cursor) break;
    }
    if (cursor) throw new Error('Public search index exceeded its limit');
    // Ranking is configured once in Algolia. Rewriting identical settings on
    // every reconciliation creates unnecessary, expensive index-level tasks.
    const ids = new Set(records.map(record => record.objectID));
    await batch([
      ...Array.from(existing).filter(id => !ids.has(id)).map(objectID => ({ action: 'deleteObject' as const, body: { objectID } })),
      ...records.map(body => ({ action: 'addObject' as const, body })),
    ]);
    return { records: records.length, removed: Array.from(existing).filter(id => !ids.has(id)).length };
  });
}
