import { CloudflareStorage } from '@openauthjs/openauth/storage/cloudflare';

type Namespace = Parameters<typeof CloudflareStorage>[0]['namespace'];
const separator = String.fromCharCode(31);

// OpenAuth's adapter reads every key sequentially. Older signing keys must
// remain available for existing sessions, but must not serialize cold starts.
export function authStorage(namespace: Namespace) {
    const base = CloudflareStorage({ namespace });
    return {
        ...base,
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
