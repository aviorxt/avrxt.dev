export interface RedisCommands {
  command<T = unknown>(...args: Array<string | number>): Promise<T>;
}

// No SDK or persistent TCP socket: compatible with serverless HTTP Redis APIs.
export function createRedisRest(url: string, token: string, fetcher: typeof fetch = fetch): RedisCommands {
  const endpoint = new URL(url);
  if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) throw new Error('Redis REST URL must be HTTPS.');
  return {
    async command<T>(...args: Array<string | number>): Promise<T> {
      const response = await fetcher(endpoint.toString().replace(/\/$/, ''), {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(args), cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(1500),
      });
      if (!response.ok) throw new Error(`Redis REST HTTP ${response.status}`);
      const body = await response.json() as { result?: T; error?: string };
      // Never propagate provider messages that could contain commands or secrets.
      if (body.error || !Object.prototype.hasOwnProperty.call(body, 'result')) throw new Error('Redis command failed');
      return body.result as T;
    },
  };
}

export function configuredRedis(): RedisCommands | null {
  const url = process.env.REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try { return createRedisRest(url, token); } catch { return null; }
}
