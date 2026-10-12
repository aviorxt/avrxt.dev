import { authStorage, minimalAuthRecord } from './storage';

type Namespace = Parameters<typeof authStorage>[0];
type Metadata = { expiresAt?: number; retiredAt?: number };
const separator = String.fromCharCode(31);
const KEY_GRACE = 31 * 86400_000;
const CHECKPOINT = 'avrxt:cleanup:cursor';

// No login history is produced. Only aggregate maintenance counts are returned.
// Unknown namespace entries and active sessions are never deleted.
export async function cleanupAuthNamespace(namespace: Namespace, now = Date.now()) {
    const counts = { scanned: 0, removedExpired: 0, minimized: 0, retiredKeys: 0, removedKeys: 0 };
    let keyOperations = 0;
    for (const prefix of ['signing:key', 'encryption:key', 'oauth:key']) {
        const records = [];
        let cursor: string | undefined;
        let complete = true;
        do {
            keyOperations++;
            const page = await namespace.list<Metadata>({ prefix: `${prefix}${separator}`, cursor, limit: 100 });
            // Reserve enough KV operations for mutations and session cleanup.
            // An incomplete family is not retired based on a partial inventory.
            if (keyOperations + page.keys.length > 500) { complete = false; break; }
            keyOperations += page.keys.length;
            for (let offset = 0; offset < page.keys.length; offset += 20) {
                const batch = await Promise.all(page.keys.slice(offset, offset + 20).map(async key => ({
                    key, value: await namespace.get(key.name, 'json') as { created?: number } | null,
                })));
                records.push(...batch);
            }
            if (page.list_complete) break;
            cursor = page.cursor;
        } while (cursor);
        if (!complete) continue;
        const valid = records.filter(item => item.value && typeof item.value.created === 'number')
            .sort((a, b) => b.value!.created! - a.value!.created!);
        // Preserve the newest two keys regardless of age, plus every retiring
        // key for longer than the maximum existing 30-day session lifetime.
        for (const { key, value } of valid.slice(2)) {
            if (keyOperations >= 700) break;
            const metadata = key.metadata || {};
            if (metadata.retiredAt && metadata.retiredAt + KEY_GRACE <= now) {
                keyOperations++;
                await namespace.delete(key.name); counts.removedKeys++;
            } else if (!metadata.retiredAt) {
                keyOperations++;
                await namespace.put(key.name, JSON.stringify(value), { metadata: { ...metadata, retiredAt: now } });
                counts.retiredKeys++;
            }
        }
    }

    let cursor = await namespace.get(CHECKPOINT) || undefined;
    // Bound each run. Continue a large namespace from its saved cursor tomorrow.
    for (let pageNumber = 0; pageNumber < 1; pageNumber++) {
        const page = await namespace.list<Metadata>({ cursor, limit: 100 });
        for (const key of page.keys) {
            counts.scanned++;
            const parts = key.name.split(separator);
            if (!['oauth:code', 'oauth:refresh'].includes(parts[0])) continue;
            const deadline = key.metadata?.expiresAt ?? (key.expiration ? key.expiration * 1000 : undefined);
            if (deadline && deadline <= now) { await namespace.delete(key.name); counts.removedExpired++; continue; }
            // Legacy records with no provable expiry are preserved, not guessed.
            if (!deadline || deadline - now < 60_000) continue;
            const value = await namespace.get(key.name, 'json');
            if (!value) continue;
            const minimal = minimalAuthRecord(parts, value);
            if (JSON.stringify(value) === JSON.stringify(minimal)) continue;
            await namespace.put(key.name, JSON.stringify(minimal), {
                expirationTtl: Math.ceil((deadline - now) / 1000), metadata: { ...key.metadata, expiresAt: deadline },
            });
            counts.minimized++;
        }
        if (page.list_complete) { cursor = undefined; break; }
        cursor = page.cursor;
    }
    if (cursor) await namespace.put(CHECKPOINT, cursor);
    else await namespace.delete(CHECKPOINT);
    return counts;
}
