import { NextResponse } from 'next/server';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export const dynamic = 'force-dynamic';

type LinkPreviewResponse = {
  url: string;
  resolvedUrl: string;
  host: string;
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string | null;
  siteName: string | null;
};

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 192 && b === 0) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if ((a === 198 && b === 51 && parts[2] === 100) || (a === 203 && b === 0 && parts[2] === 113)) return true;
  if (a >= 224) return true;
  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const value = ip.toLowerCase();
  return value === '::' || value === '::1' || value.startsWith('::') || value.startsWith('fc') || value.startsWith('fd') ||
    value.startsWith('fe8') || value.startsWith('fe9') || value.startsWith('fea') || value.startsWith('feb') ||
    value.startsWith('ff') || value.startsWith('::ffff:');
}

function isLikelyPrivateHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.internal')) return true;
  if (h.endsWith('.local')) return true;
  if (h === '0.0.0.0') return true;
  return false;
}

function getMeta(html: string, key: { attr: 'property' | 'name'; value: string }): string | null {
  const re = new RegExp(
    `<meta\\s+[^>]*${key.attr}=[\"']${key.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\"'][^>]*>`,
    'i'
  );
  const m = html.match(re);
  if (!m) return null;
  const tag = m[0];
  const content = tag.match(/content=["']([^"']+)["']/i)?.[1];
  return content ? content.trim() : null;
}

function getTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1]?.trim() || null;
}

function getFaviconHref(html: string): string | null {
  // Prefer common icon rels.
  const rels = [
    'apple-touch-icon',
    'icon',
    'shortcut icon',
    'mask-icon',
  ];
  for (const rel of rels) {
    const re = new RegExp(`<link\\s+[^>]*rel=[\"']${rel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\"'][^>]*>`, 'i');
    const m = html.match(re);
    if (!m) continue;
    const tag = m[0];
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    if (href) return href.trim();
  }
  return null;
}

function abs(baseUrl: string, maybeRelative: string | null): string | null {
  if (!maybeRelative) return null;
  try {
    return new URL(maybeRelative, baseUrl).toString();
  } catch {
    return null;
  }
}

async function assertPublicHostname(hostname: string): Promise<void> {
  const normalizedHost = hostname.replace(/^\[|\]$/g, '').toLowerCase().replace(/\.$/, '');
  if (isLikelyPrivateHost(normalizedHost)) {
    throw new Error('Blocked hostname');
  }

  const ipVersion = isIP(normalizedHost);
  if (ipVersion === 4 && isPrivateIpv4(normalizedHost)) throw new Error('Blocked IP');
  if (ipVersion === 6 && isPrivateIpv6(normalizedHost)) throw new Error('Blocked IP');
  if (ipVersion) return;

  // Best-effort DNS resolve to block private IPv4 ranges.
  // (Vercel/Node environments may not always resolve IPv6 here; keep it simple.)
  const results = await lookup(normalizedHost, { all: true, verbatim: true });
  for (const r of results) {
    if ((r.family === 4 && isPrivateIpv4(r.address)) || (r.family === 6 && isPrivateIpv6(r.address))) {
      throw new Error('Blocked IP');
    }
  }
}

async function readHtmlLimited(response: Response, limit: number): Promise<string> {
  const length = Number(response.headers.get('content-length'));
  if (Number.isFinite(length) && length > limit) throw new Error('Response too large');
  if (!response.body) return '';

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      throw new Error('Response too large');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const input = (searchParams.get('url') || '').trim();
  if (!input) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }
  if (input.length > 2048) return NextResponse.json({ error: 'URL is too long' }, { status: 400 });

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    return NextResponse.json({ error: 'Unsupported protocol' }, { status: 400 });
  }
  if (url.username || url.password) return NextResponse.json({ error: 'Credentials in URL are not supported' }, { status: 400 });

  try {
    await assertPublicHostname(url.hostname);
  } catch {
    return NextResponse.json({ error: 'Blocked url' }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    let target = url;
    let res: Response | undefined;
    for (let redirectCount = 0; redirectCount <= 4; redirectCount += 1) {
      await assertPublicHostname(target.hostname);
      res = await fetch(target.toString(), {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible; avrxt-link-preview/1.0; +https://avrxt.dev)',
          accept: 'text/html,application/xhtml+xml',
        },
        cache: 'no-store',
      });

      if (res.status < 300 || res.status >= 400) break;
      const location = res.headers.get('location');
      if (!location || redirectCount === 4) throw new Error('Too many redirects');
      await res.body?.cancel();
      target = new URL(location, target);
      if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password) {
        throw new Error('Blocked redirect');
      }
    }
    if (!res) throw new Error('Fetch failed');

    const resolvedUrl = target.toString();
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('text/html')) {
      await res.body?.cancel();
      const payload: LinkPreviewResponse = {
        url: url.toString(),
        resolvedUrl,
        host: new URL(resolvedUrl).host,
        title: null,
        description: null,
        image: null,
        favicon: abs(resolvedUrl, '/favicon.ico'),
        siteName: new URL(resolvedUrl).hostname,
      };

      return NextResponse.json(payload, {
        headers: {
          'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      });
    }

    const html = await readHtmlLimited(res, 1_000_000);

    const ogTitle = getMeta(html, { attr: 'property', value: 'og:title' });
    const ogDesc = getMeta(html, { attr: 'property', value: 'og:description' });
    const ogImage = getMeta(html, { attr: 'property', value: 'og:image' });
    const ogSiteName = getMeta(html, { attr: 'property', value: 'og:site_name' });

    const twTitle = getMeta(html, { attr: 'name', value: 'twitter:title' });
    const twDesc = getMeta(html, { attr: 'name', value: 'twitter:description' });
    const twImage = getMeta(html, { attr: 'name', value: 'twitter:image' });

    const desc = ogDesc || twDesc || getMeta(html, { attr: 'name', value: 'description' });
    const title = ogTitle || twTitle || getTitle(html);
    const image = abs(resolvedUrl, ogImage || twImage);
    const favicon = abs(resolvedUrl, getFaviconHref(html)) || abs(resolvedUrl, '/favicon.ico');

    const payload: LinkPreviewResponse = {
      url: url.toString(),
      resolvedUrl,
      host: new URL(resolvedUrl).host,
      title,
      description: desc,
      image,
      favicon,
      siteName: ogSiteName || new URL(resolvedUrl).hostname,
    };

    return NextResponse.json(payload, {
      headers: {
        'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (e: any) {
    const message = e?.name === 'AbortError' ? 'Timeout' : 'Fetch failed';
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    clearTimeout(timeout);
  }
}

