import test from 'node:test';
import assert from 'node:assert/strict';
import { createPublicCache, PUBLISH_CACHE, RELEASE_LOCK } from '../src/lib/cache-core';
import { createRedisRest } from '../src/lib/redis-rest';
import { redisRateLimit, FIXED_WINDOW_LIMIT } from '../src/lib/redis-rate-limit';

// Redis command contract double; these tests do not provision an external DB.
class MemoryRedis {
  clock = 0;
  data = new Map<string, { value: string; expires?: number }>();
  read(key: string) {
    const entry = this.data.get(key);
    if (entry?.expires !== undefined && entry.expires <= this.clock) { this.data.delete(key); return null; }
    return entry?.value ?? null;
  }
  async command<T = unknown>(...args: Array<string | number>): Promise<T> {
    const [name, ...parameters] = args;
    const values = parameters.map(String);
    let result: unknown;
    if (name === 'GET') result = this.read(values[0]);
    else if (name === 'MGET') result = values.map(key => this.read(key));
    else if (name === 'MSET') {
      for (let i=0; i<values.length; i+=2) this.data.set(values[i], { value: values[i+1] });
      result = 'OK';
    } else if (name === 'SET') {
      if (values.includes('NX') && this.read(values[0]) !== null) result = null;
      else {
        const px = values.indexOf('PX');
        this.data.set(values[0], { value: values[1], ...(px >= 0 ? { expires: this.clock + Number(values[px+1]) } : {}) });
        result = 'OK';
      }
    } else if (name === 'EVAL') {
      const script = values[0], count = Number(values[1]);
      const keys = values.slice(2, 2+count), argv = values.slice(2+count);
      if (script === RELEASE_LOCK) {
        result = this.read(keys[0]) === argv[0] ? Number(this.data.delete(keys[0])) : 0;
      } else if (script === PUBLISH_CACHE) {
        const current = this.read(keys[1]) === argv[0] && keys.slice(2).every((key,i) => (this.read(key) || '0') === argv[i+3]);
        if (current) this.data.set(keys[0], { value: argv[1], expires: this.clock + Number(argv[2]) * 1000 });
        result = current ? 1 : 0;
      } else if (script === FIXED_WINDOW_LIMIT) {
        const previous = this.read(keys[0]);
        const count = Number(previous || 0)+1;
        this.data.set(keys[0], { value: String(count), expires: previous ? this.data.get(keys[0])?.expires : this.clock+Number(argv[1]) });
        result = count > Number(argv[0]) ? 1 : 0;
      } else throw new Error('Unknown script');
    } else throw new Error('Unsupported command');
    return result as T;
  }
}

test('public reads hit Redis until TTL, then reload; cache keys do not collide', async () => {
  const redis = new MemoryRedis(); const cache = createPublicCache(() => redis, 'test');
  let reads = 0; const loader = async () => ({ revision: ++reads });
  assert.deepEqual(await cache.get('profile', { ttlSeconds: 2, tags: ['profile'] }, loader), { revision: 1 });
  assert.deepEqual(await cache.get('profile', { ttlSeconds: 2, tags: ['profile'] }, loader), { revision: 1 });
  assert.equal(reads, 1);
  assert.deepEqual(await cache.get('other', { ttlSeconds: 2 }, loader), { revision: 2 });
  redis.clock = 2001;
  assert.deepEqual(await cache.get('profile', { ttlSeconds: 2, tags: ['profile'] }, loader), { revision: 3 });
});
test('production and preview caches do not share data or invalidation', async () => {
  const redis = new MemoryRedis(); const prod = createPublicCache(() => redis, 'production'); const preview = createPublicCache(() => redis, 'preview');
  await prod.get('profile', { ttlSeconds: 60, tags: ['profile'] }, async () => 'production');
  assert.equal(await preview.get('profile', { ttlSeconds: 60, tags: ['profile'] }, async () => 'preview'), 'preview');
  await preview.invalidate('profile');
  assert.equal(await prod.get('profile', { ttlSeconds: 60, tags: ['profile'] }, async () => 'should-not-load'), 'production');
});
test('parallel misses on one instance call the origin once', async () => {
  const redis = new MemoryRedis(); const cache = createPublicCache(() => redis, 'test');
  let reads = 0;
  const values = await Promise.all(Array.from({ length: 30 }, () => cache.get('profile', { ttlSeconds: 60 }, async () => {
    reads++; await new Promise(resolve => setTimeout(resolve, 20)); return { title: 'Public' };
  })));
  assert.equal(reads, 1); assert.equal(values.length, 30);
});
test('separate instances use the shared fill lock', async () => {
  const redis = new MemoryRedis(); const first = createPublicCache(() => redis, 'test'); const second = createPublicCache(() => redis, 'test');
  let reads = 0;
  const load = async () => { reads++; await new Promise(resolve => setTimeout(resolve, 20)); return 'public'; };
  assert.deepEqual(await Promise.all([first.get('docs', { ttlSeconds: 60 }, load), second.get('docs', { ttlSeconds: 60 }, load)]), ['public','public']);
  assert.equal(reads, 1);
});
test('tag invalidation refreshes list and detail entries across instances', async () => {
  const redis = new MemoryRedis(); const first = createPublicCache(() => redis, 'test'); const second = createPublicCache(() => redis, 'test');
  let revision = 1; const loader = async () => revision;
  await first.get('docs', { ttlSeconds: 300, tags: ['docs'] }, loader);
  await second.get('doc:a', { ttlSeconds: 300, tags: ['docs'] }, loader);
  revision = 2; assert.equal(await first.invalidate('docs'), true);
  assert.equal(await second.get('docs', { ttlSeconds: 300, tags: ['docs'] }, loader), 2);
  assert.equal(await first.get('doc:a', { ttlSeconds: 300, tags: ['docs'] }, loader), 2);
});
test('a loader started before invalidation cannot repopulate the new generation', async () => {
  const redis = new MemoryRedis(); const cache = createPublicCache(() => redis, 'test');
  let finish!: (value: string) => void; let started!: () => void;
  const ready = new Promise<void>(resolve => { started = resolve; });
  const oldRead = cache.get('doc', { ttlSeconds: 300, tags: ['docs'] }, async () => { started(); return new Promise<string>(resolve => { finish = resolve; }); });
  await ready; await cache.invalidate('docs'); finish('old'); await oldRead;
  assert.equal(await cache.get('doc', { ttlSeconds: 300, tags: ['docs'] }, async () => 'new'), 'new');
  assert.equal([...redis.data.values()].some(entry => entry.value === JSON.stringify({ value: 'old' })), false);
});
test('an expired fill cannot publish or delete another request’s lock', async () => {
  const redis = new MemoryRedis(); const cache = createPublicCache(() => redis, 'test');
  let finish!: (value: string) => void; let started!: () => void;
  const ready = new Promise<void>(resolve => { started = resolve; });
  const pending = cache.get('slow', { ttlSeconds: 60 }, async () => { started(); return new Promise<string>(resolve => { finish = resolve; }); });
  await ready; const lock = [...redis.data.keys()].find(key => key.endsWith(':lock'))!;
  redis.clock = 30001; await redis.command('SET',lock,'new-owner','NX','PX',30000);
  finish('late'); await pending;
  assert.equal(redis.read(lock), 'new-owner');
  assert.equal([...redis.data.values()].some(entry => entry.value === JSON.stringify({ value: 'late' })), false);
});
test('Redis failure and missing configuration fall back to origin; origin errors are not cached', async () => {
  const broken = { command: async <T>() => { throw new Error('unavailable'); } };
  const cache = createPublicCache(() => broken, 'test');
  assert.equal(await cache.get('profile', { ttlSeconds: 60 }, async () => 'origin'), 'origin');
  assert.equal(await cache.invalidate('profile'), false);
  const noRedis = createPublicCache(() => null, 'test');
  assert.equal(await noRedis.get('profile', { ttlSeconds: 60 }, async () => 'origin'), 'origin');
  const redis = new MemoryRedis(); const working = createPublicCache(() => redis, 'test');
  await assert.rejects(working.get('profile', { ttlSeconds: 60 }, async () => { throw new Error('DB failed'); }));
  assert.equal(await working.get('profile', { ttlSeconds: 60 }, async () => 'recovered'), 'recovered');
});
test('do not cache missing articles or oversized payloads', async () => {
  const redis = new MemoryRedis(); const cache = createPublicCache(() => redis, 'test'); let reads = 0;
  const options = { ttlSeconds: 300, cacheable: (value: unknown) => value !== null };
  await cache.get('doc', options, async () => { reads++; return null; });
  await cache.get('doc', options, async () => { reads++; return null; });
  assert.equal(reads, 2);
  await cache.get('huge', { ttlSeconds: 60 }, async () => 'a'.repeat(600000));
  assert.equal([...redis.data.keys()].some(key => key.includes(':data:')), false);
});
test('Redis rate limits preserve the original window rather than extending expiry', async () => {
  const redis = new MemoryRedis();
  assert.equal(await redisRateLimit(redis, 'hash', 2, 1000), false);
  redis.clock = 400; assert.equal(await redisRateLimit(redis, 'hash', 2, 1000), false);
  redis.clock = 800; assert.equal(await redisRateLimit(redis, 'hash', 2, 1000), true);
  redis.clock = 1001; assert.equal(await redisRateLimit(redis, 'hash', 2, 1000), false);
});
test('REST transport sends authenticated JSON commands, prevents redirects and sanitizes errors', async () => {
  const redis = createRedisRest('https://redis.example', 'private-token', (async (_url, init) => {
    assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer private-token');
    assert.equal(init?.redirect, 'error'); assert.equal(init?.cache, 'no-store');
    assert.deepEqual(JSON.parse(String(init?.body)), ['SET','key','value','EX',60]);
    return Response.json({ result: 'OK' });
  }) as typeof fetch);
  assert.equal(await redis.command('SET','key','value','EX',60), 'OK');
  const rejected = createRedisRest('https://redis.example', 'secret', (async () => Response.json({ error: 'private-provider-command-details' })) as typeof fetch);
  await assert.rejects(rejected.command('GET','key'), error => error instanceof Error && error.message === 'Redis command failed');
  assert.throws(() => createRedisRest('http://redis.example', 'secret'));
});
