import { LRUCache } from 'lru-cache';

const requests = new LRUCache<string, number>({ max: 5000 });

// Uses platform-provided client addresses when present and user IDs for server actions.
export function isRateLimited(headers: Headers, key: string, limit: number, windowMs: number): boolean {
    const address = headers.get('cf-connecting-ip') || headers.get('x-real-ip') || 'unknown';
    const cacheKey = `${key}:${address.slice(0, 80)}`;
    const count = requests.get(cacheKey) || 0;
    if (count >= limit) return true;
    requests.set(cacheKey, count + 1, { ttl: windowMs });
    return false;
}
