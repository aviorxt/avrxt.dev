import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
require('@next/env').loadEnvConfig(process.cwd());
const url = process.env.REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
if (!url || !token) {
  console.error('Redis is not configured. Set server-only REDIS_REST_URL and REDIS_REST_TOKEN.');
  process.exitCode = 1;
} else {
  try {
    const endpoint = new URL(url);
    if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) throw new Error('Invalid URL');
    const response = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(['PING']), redirect: 'error', signal: AbortSignal.timeout(3000) });
    const body = await response.json();
    if (!response.ok || body.result !== 'PONG') throw new Error('PING failed');
    console.log('Redis REST connectivity verified (PONG). Credentials were not displayed.');
  } catch {
    console.error('Redis check failed. Verify the HTTPS endpoint, token and provider access.');
    process.exitCode = 1;
  }
}
