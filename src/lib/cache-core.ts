import { createHash, randomUUID } from 'node:crypto';
import type { RedisCommands } from './redis-rest';

export const RELEASE_LOCK = `if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end return 0`;
// Lock ownership and tag versions fence late loaders out after a mutation.
export const PUBLISH_CACHE = `
if redis.call('GET', KEYS[2]) ~= ARGV[1] then return 0 end
for i = 3, #KEYS do
  if (redis.call('GET', KEYS[i]) or '0') ~= ARGV[i+1] then return 0 end
end
redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])
return 1`;

export type CacheOptions = { ttlSeconds: number; tags?: string[]; cacheable?: (value: any) => boolean };

export function createPublicCache(redis: () => RedisCommands | null, namespace: string, waitMs = 2500) {
  const flights = new Map<string, Promise<any>>();
  let bypassUntil = 0;
  const prefix = `${namespace}:public:v1`;
  const tagKeys = (tags: string[]) => [...new Set(tags)].sort().map(tag => `${prefix}:tag:${tag}`);
  const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  function decode<T>(input: string): T {
    const parsed = JSON.parse(input);
    if (!parsed || !Object.prototype.hasOwnProperty.call(parsed, 'value')) throw new Error('Invalid cache value');
    return parsed.value as T;
  }

  async function read<T>(key: string, options: CacheOptions, loader: () => Promise<T>): Promise<T> {
    const tags = tagKeys(options.tags || []);
    let store = Date.now() >= bypassUntil ? redis() : null;
    let versions: string[] = [];
    let cacheKey = '';
    let lockKey = '';
    const token = randomUUID();
    let ownsLock = false;
    if (store) {
      try {
        versions = tags.length ? (await store.command<Array<string | null>>('MGET', ...tags)).map(value => value ?? '0') : [];
        cacheKey = `${prefix}:data:${createHash('sha256').update(JSON.stringify([key, versions])).digest('hex')}`;
        lockKey = `${cacheKey}:lock`;
        const cached = await store.command<string | null>('GET', cacheKey);
        if (cached !== null) return decode<T>(cached);
        ownsLock = await store.command('SET', lockKey, token, 'NX', 'PX', 30000) === 'OK';
        if (!ownsLock) {
          const deadline = Date.now() + waitMs;
          while (Date.now() < deadline) {
            await pause(100);
            const filled = await store.command<string | null>('GET', cacheKey);
            if (filled !== null) return decode<T>(filled);
            if (await store.command('GET', lockKey) === null) {
              ownsLock = await store.command('SET', lockKey, token, 'NX', 'PX', 30000) === 'OK';
              if (ownsLock) break;
            }
          }
        }
      } catch {
        // Caching is optional; never turn a Redis outage into a page failure.
        store = null;
        bypassUntil = Date.now() + 5000;
      }
    }
    try {
      const value = await loader();
      if (store && ownsLock && value !== undefined && (!options.cacheable || options.cacheable(value))) {
        try {
          const serialized = JSON.stringify({ value });
          if (Buffer.byteLength(serialized) <= 512 * 1024) {
            await store.command('EVAL', PUBLISH_CACHE, tags.length + 2, cacheKey, lockKey, ...tags,
              token, serialized, Math.max(1, Math.floor(options.ttlSeconds)), ...versions);
          }
        } catch { bypassUntil = Date.now() + 5000; }
      }
      return value;
    } finally {
      if (store && ownsLock) {
        try { await store.command('EVAL', RELEASE_LOCK, 1, lockKey, token); } catch { /* lock has a bounded expiry */ }
      }
    }
  }

  return {
    async get<T>(key: string, options: CacheOptions, loader: () => Promise<T>): Promise<T> {
      // Sharing only explicit public loaders, never request cookies or user IDs.
      const flightKey = JSON.stringify([key, options.tags || []]);
      const current = flights.get(flightKey);
      if (current) return current as Promise<T>;
      const pending = read(key, options, loader);
      flights.set(flightKey, pending);
      try { return await pending; } finally { if (flights.get(flightKey) === pending) flights.delete(flightKey); }
    },
    async invalidate(...tags: string[]): Promise<boolean> {
      flights.clear();
      const store = redis();
      if (!store) return true;
      try {
        const keys = tagKeys(tags);
        if (keys.length) await store.command('MSET', ...keys.flatMap(key => [key, randomUUID()]));
        return true;
      } catch {
        bypassUntil = Date.now() + 5000;
        return false;
      }
    },
  };
}
