import 'server-only';
import { createPublicCache } from '@/lib/cache-core';
import { configuredRedis } from '@/lib/redis-rest';

// Use a separate namespace for preview/local deployments sharing one Redis DB.
const namespace = process.env.REDIS_CACHE_NAMESPACE || `avrxt:${process.env.VERCEL_ENV || process.env.NODE_ENV || 'development'}`;
const cache = createPublicCache(configuredRedis, namespace);
export const cachedPublic = cache.get;
export const invalidatePublicCache = cache.invalidate;
