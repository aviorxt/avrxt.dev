import { CloudflareStorage } from '@openauthjs/openauth/storage/cloudflare';

type Namespace = Parameters<typeof CloudflareStorage>[0]['namespace'];
const separator = String.fromCharCode(31);

export function minimalAuthRecord<T>(key: string[], value: T): T {
    if (!['oauth:code', 'oauth:refresh'].includes(key[0]) || !value || typeof value !== 'object') return value;
    const record = value as Record<string, unknown>;
    const properties = record.properties;
    if (!properties || typeof properties !== 'object') return value;
    const identity = properties as Record<string, unknown>;
    return { ...record, properties: { id: identity.id, provider: identity.provider, admin: identity.admin } } as T;
}

// OpenAuth's adapter reads every key sequentially. Older signing keys must
// remain available for existing sessions, but must not serialize cold starts.
export function authStorage(namespace: Namespace) {
    const base = CloudflareStorage({ namespace });
    return {
        ...base,
        async get(key: string[]) {
            return minimalAuthRecord(key, await base.get(key));
        },
        async set(key: string[], value: unknown, expiry?: Date) {
            const isSession = ['oauth:code', 'oauth:refresh'].includes(key[0]);
            const deadline = expiry?.getTime() ?? (isSession ? Date.now() + (key[0] === 'oauth:code' ? 60_000 : 30 * 86400_000) : undefined);
            await namespace.put(key.join(separator), JSON.stringify(minimalAuthRecord(key, value)), {
                // KV rejects expirationTtl below 60; floor() can turn 60 into 59.
                ...(deadline ? { expirationTtl: Math.max(60, Math.ceil((deadline - Date.now()) / 1000)) } : {}),
                ...(deadline ? { metadata: { expiresAt: deadline } } : {}),
            });
        },
        async *scan(prefix: string[]) {
            let cursor: string | undefined;
            do {
                const page = await namespace.list({ prefix: [...prefix, ''].join(separator), cursor });
                for (let offset = 0; offset < page.keys.length; offset += 20) {
                    const batch = page.keys.slice(offset, offset + 20);
                    const values = await Promise.all(batch.map(async key => ({
                        name: key.name, value: await namespace.get(key.name, 'json'),
                    })));
                    for (const { name, value } of values) {
                        if (value !== null) yield [name.split(separator), value] as [string[], unknown];
                    }
                }
                if (page.list_complete) break;
                cursor = page.cursor;
            } while (cursor);
        },
    };
}
