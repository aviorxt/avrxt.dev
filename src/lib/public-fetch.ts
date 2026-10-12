import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';

export function publicAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a,b,c] = address.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 0 || b === 168)) || (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51 && c === 100) || (a === 203 && b === 0 && c === 113));
  }
  if (isIP(address) === 6) {
    const value = address.toLowerCase();
    // Only global-unicast IPv6, excluding special-use ranges and embedded IPv4.
    return /^[23]/.test(value) && !value.startsWith('2001:db8:') && !value.startsWith('2001:0:') && !value.startsWith('2002:');
  }
  return false;
}

export async function publicFetch(url: URL, signal: AbortSignal): Promise<Response> {
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      (url.port && !['80','443'].includes(url.port))) throw new Error('Blocked URL');
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = isIP(hostname) ? [{ address: hostname, family: isIP(hostname) }] : await Promise.race([
    lookup(hostname, { all: true, verbatim: true }),
    new Promise<never>((_, reject) => {
      if (signal.aborted) reject(signal.reason);
      else signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    }),
  ]);
  if (!addresses.length || addresses.some(item => !publicAddress(item.address))) throw new Error('Blocked address');
  const pinned = addresses[0];
  return new Promise((resolve, reject) => {
    const transport = url.protocol === 'https:' ? httpsRequest : httpRequest;
    const req = transport(url, {
      signal, agent: false,
      // Keep hostname/SNI and certificate checks intact; only DNS is pinned.
      lookup: (_host, options, callback) => {
        if (options.all) callback(null, [pinned]);
        else callback(null, pinned.address, pinned.family);
      },
      headers: { accept: 'text/html,application/xhtml+xml', 'accept-encoding': 'identity', 'user-agent': 'avrxt-link-preview/1.0' },
    }, response => {
      const chunks: Buffer[] = []; let bytes = 0;
      response.on('data', chunk => {
        bytes += chunk.length;
        if (bytes > 1_000_000) { req.destroy(new Error('Response too large')); return; }
        chunks.push(chunk);
      });
      response.on('error', reject);
      response.on('end', () => {
        const headers = new Headers();
        for (const [name,value] of Object.entries(response.headers)) if (value) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
        const status = response.statusCode || 502;
        resolve(new Response([204,205,304].includes(status) ? null : Buffer.concat(chunks), { status, headers }));
      });
    });
    req.on('error', reject); req.end();
  });
}
