import type { RedisCommands } from './redis-rest';

export const FIXED_WINDOW_LIMIT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 or redis.call('PTTL', KEYS[1]) < 0 then redis.call('PEXPIRE', KEYS[1], ARGV[2]) end
if count > tonumber(ARGV[1]) then return 1 end
return 0`;

export async function redisRateLimit(redis: RedisCommands, hash: string, limit: number, windowMs: number): Promise<boolean> {
  const namespace = process.env.REDIS_CACHE_NAMESPACE || `avrxt:${process.env.VERCEL_ENV || process.env.NODE_ENV || 'development'}`;
  const limited = await redis.command<number>('EVAL', FIXED_WINDOW_LIMIT, 1, `${namespace}:rate:v1:${hash}`, limit, windowMs);
  if (limited !== 0 && limited !== 1) throw new Error('Invalid Redis rate-limit response');
  return limited === 1;
}
