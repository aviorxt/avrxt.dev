import { LRUCache } from 'lru-cache';
import { createHash } from 'node:crypto';
import { createAdminClient } from '@/utils/supabase/admin';
import { clientAddress } from '@/lib/client-address';
import { configuredRedis } from '@/lib/redis-rest';
import { redisRateLimit } from '@/lib/redis-rate-limit';

const requests = new LRUCache<string, { count: number; expiresAt: number }>({ max: 5000 });

// Uses platform-provided client addresses when present and user IDs for server actions.
export async function isRateLimited(headers: Headers, key: string, limit: number, windowMs: number, identity?: string): Promise<boolean> {
    const cacheKey = createHash('sha256').update(`${key}:${identity || clientAddress(headers)}`).digest('hex');
    const redis = configuredRedis();
    if (redis) {
        try { return await redisRateLimit(redis, cacheKey, limit, windowMs); }
        catch { /* Preserve the existing database-backed protection during Redis outages. */ }
    }
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
            const { data, error } = await createAdminClient().rpc('consume_rate_limit', {
                bucket_key: cacheKey, max_requests: limit, window_seconds: Math.ceil(windowMs / 1000),
            });
            if (error || typeof data !== 'boolean') throw new Error('Rate limiter unavailable');
            return !data;
        } catch {
            // Fail closed in production rather than silently dropping distributed limits.
            if (process.env.NODE_ENV === 'production') return true;
        }
    } else if (process.env.NODE_ENV === 'production') return true;
    const now = Date.now();
    const current = requests.get(cacheKey);
    const entry = current && current.expiresAt > now ? current : { count: 0, expiresAt: now + windowMs };
    if (entry.count >= limit) return true;
    entry.count++;
    requests.set(cacheKey, entry, { ttl: entry.expiresAt - now });
    return false;
}
