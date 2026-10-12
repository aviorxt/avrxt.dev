# Redis REST caching

The frontend and backend remain Next.js. Public reads use Redis before reaching Supabase or external services; mutations still write to their source of truth. The API gateway continues forwarding to the web backend.

## Configuration

Set these **server-only** environment variables in the web deployment:

```dotenv
REDIS_REST_URL=https://your-redis-rest-endpoint
REDIS_REST_TOKEN=your-write-enabled-token
REDIS_CACHE_NAMESPACE=avrxt:production
```

`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are accepted aliases. The transport uses [the Redis REST JSON-command protocol](https://upstash.com/docs/redis/features/restapi): authenticated HTTPS POST requests containing a command array. Ordinary TCP-only Redis endpoints do not work with this transport. Tokens must permit GET, MGET, SET, MSET, EVAL and the Redis operations inside the scripts, including DEL, INCR, PTTL and PEXPIRE.

Use different namespaces for production, previews and local testing, especially when sharing one database. The default namespace includes VERCEL_ENV or NODE_ENV. Set a branch-specific namespace for independent previews. Never put a token in NEXT_PUBLIC variables or URLs, and never cache secrets in `me_config`.

Credentials are never committed. On 12 October 2026, `avrxt-cache` was provisioned on Upstash Free in Northern Virginia with HTTPS REST/TLS. The local connection is in ignored `.env.local`; the Vercel `avrxt-in` project has the three Production Secrets configured. Local and production namespaces are distinct. Live cache, invalidation, locking and rate-limit checks passed. Application deployment is still needed to activate the cache on the live site.

Run `npm run redis:check` to verify connectivity. Missing configuration or a cache outage falls back to origin reads; Redis-backed rate limits fall back to the existing Supabase limiter, which remains fail-closed in production if both protections are unavailable. The chosen free database currently provides 500,000 commands/month, about 250 MB storage and 10 GB monthly bandwidth; monitor usage after rollout.

## Cached data

| Public data | Redis TTL | Invalidation |
|---|---:|---|
| Profile configuration | 120 seconds | Profile save |
| Maintenance flag | 10 seconds | Profile save |
| Published article list | 300 seconds | Article create/update/delete |
| Published article details | 300 seconds | Article create/update/delete |
| Sitemap and article OG data | Share article entries | Article create/update/delete |
| Spotify now-playing | 15 seconds | Connect/disconnect, or expiry |
| Spotify chart | 30 seconds | Connect/disconnect, or expiry |
| Public system status | 30 seconds | Expiry |
| Link preview metadata | 3600 seconds | Expiry |

Admin article reads, private drafts, tokens, permission checks and mutations bypass the public cache. Public Supabase loaders use the anonymous key without session cookies, select only public article fields and require `published=true`. Rate limiting and URL validation run before link-preview cache lookup. Failed loaders, missing article details, disconnected charts, unknown status and payloads over 512 KiB are not stored.

## Misses, invalidation and outages

Requests on the same instance share one in-flight public read. Across instances, SET NX PX creates a 30-second fill lock. A competing instance waits up to approximately 2.5 seconds for the cache, then falls back to its origin rather than hanging. Very slow origins can therefore still see duplicate requests. Lock release checks ownership.

Profile, articles and Spotify use versioned invalidation tags. Successful mutations replace the tag generation before returning. Lua publication checks both lock ownership and generations, preventing an older read from repopulating cache after a write. Old generation entries expire naturally; no wildcard deletion or global FLUSH operation is used.

Redis calls have a 1.5-second timeout. During cache errors, the instance bypasses Redis briefly and serves origin data. Cache invalidation failure does not undo an already committed database write; profile/article saves report a warning. If Redis was unavailable during a mutation, stale entries can survive until their TTL after recovery. Normal invalidation is immediate at the Redis layer; browser/CDN copies and already in-flight requests can still briefly display older data.

Tag generation keys intentionally persist to avoid generation reset collisions. Data and locks expire. Redis capacity/eviction and provider costs should be monitored; TTL and payload bounds do not establish a maximum number of unique URL keys.

## Verification and deployment

`npm test` includes command-contract tests for hits, TTL expiry, namespace/key separation, same-instance and cross-instance misses, tag invalidation, stale-fill fencing, outages, loader failures, payload limits, fixed-window rate limits and REST transport behavior. These use a Redis command double, not a provisioned Redis database; provider Lua/ACL behavior must also be checked after configuring credentials.

Deploy the web changes after the database migrations from the earlier security work. Redis itself needs no new Supabase migration. Gateway Redis secrets are unnecessary because Redis reads happen in the Next.js origin. Keep the existing signed client-IP gateway setup for per-visitor rate limits.

For deployment QA: configure credentials, run the connectivity check, load a public profile twice, save an admin profile change and verify it appears, publish/unpublish an article and verify both list/detail views, and test behavior with Redis temporarily unavailable. Successful cache hits should avoid public-data queries to Supabase. Existing auth/private-data flows should remain uncached.
