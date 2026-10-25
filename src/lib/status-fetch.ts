import { parseStatusSnapshot, unavailableStatus } from './status-model';

// Fixed public Better Stack sources. No visitor URL or account token is accepted.
const SOURCES = ['https://avrxt-dev.betteruptime.com/index.json', 'https://status.avrxt.dev/index.json'];
export async function loadPublicStatus(request = fetch) {
  for (const source of SOURCES) {
    try {
      const response = await request(source, { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(4000), headers: { Accept: 'application/json' } });
      if (!response.ok) continue;
      if (Number(response.headers.get('content-length') || 0) > 2_000_000) continue;
      const reader = response.body?.getReader();
      if (!reader) continue;
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > 2_000_000) throw new Error('Public status response too large');
          chunks.push(value);
        }
      } catch (error) { await reader.cancel().catch(() => {}); throw error; }
      return parseStatusSnapshot(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    } catch { /* Only the other fixed public source may be tried. */ }
  }
  return unavailableStatus();
}
