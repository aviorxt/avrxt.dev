import 'server-only';
import { isIP } from 'node:net';
import { lookup, resolveMx } from 'node:dns/promises';
import { Socket } from 'node:net';
import { NextRequest, NextResponse } from 'next/server';
import { isRateLimited } from '@/lib/api-rate-limit';
import { readJsonLimited, RequestBodyError } from '@/lib/read-json-limited';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DNS_TYPES = new Set(['A', 'AAAA', 'CAA', 'CNAME', 'DNSKEY', 'DS', 'HTTPS', 'MX', 'NAPTR', 'NS', 'PTR', 'SOA', 'SRV', 'SVCB', 'TLSA', 'TXT']);
const FALLBACK_FONTS = ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Raleway', 'Merriweather', 'Playfair Display', 'Space Grotesk', 'DM Sans', 'Manrope', 'Outfit', 'Work Sans', 'Fira Sans', 'Fira Code', 'IBM Plex Sans', 'IBM Plex Mono', 'Source Sans 3', 'Source Serif 4', 'JetBrains Mono', 'Libre Baskerville', 'Archivo', 'Bebas Neue', 'Cabin', 'Cormorant Garamond', 'Crimson Pro', 'EB Garamond', 'Inconsolata', 'Karla', 'Lexend', 'Lora', 'Noto Sans', 'Noto Serif', 'Nunito', 'Oswald', 'PT Sans', 'PT Serif', 'Quicksand', 'Rubik', 'Ubuntu', 'Vollkorn'];
let fontCatalogCache: { fonts: string[]; expiresAt: number } | null = null;

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}

function clientIp(request: NextRequest) {
  return (request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0] || 'unavailable').trim().slice(0, 80);
}

function cleanDomain(raw: string) {
  const value = raw.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0].replace(/\.$/, '');
  if (value.length > 253 || !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(value)) throw new Error('Enter a valid fully-qualified domain name.');
  return value;
}

function isPublicAddress(address: string) {
  if (isIP(address) === 4) {
    const [a, b, c] = address.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 0 || b === 168)) || (a === 198 && (b === 18 || b === 19)) || (a === 198 && b === 51 && c === 100) || (a === 203 && b === 0 && c === 113));
  }
  if (isIP(address) === 6) {
    const value = address.toLowerCase();
    return !(value === '::' || value === '::1' || value.startsWith('fc') || value.startsWith('fd') || value.startsWith('fe8') || value.startsWith('fe9') || value.startsWith('fea') || value.startsWith('feb') || value.startsWith('ff') || value.startsWith('2001:db8:') || value.startsWith('::ffff:'));
  }
  return false;
}

async function resolvePublicHost(raw: string) {
  const host = raw.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0].replace(/^\[/, '').replace(/\]$/, '');
  if (!host || host.length > 253 || (!isIP(host) && !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(host))) throw new Error('Enter a valid public IP address or hostname.');
  const results = isIP(host) ? [{ address: host, family: isIP(host) }] : await lookup(host, { all: true, verbatim: true });
  if (!results.length || results.some(({ address }) => !isPublicAddress(address))) throw new Error('Private, local, reserved, and mixed-address targets are blocked.');
  return { host, address: results[0].address, family: results[0].family };
}

async function tcpCheck(host: string, port: number) {
  return new Promise<{ open: boolean; latencyMs: number; reason: string }>((resolve) => {
    const started = Date.now(); let settled = false;
    const socket = new Socket();
    const done = (open: boolean, reason: string) => { if (settled) return; settled = true; socket.destroy(); resolve({ open, latencyMs: Date.now() - started, reason }); };
    socket.setTimeout(3500);
    socket.once('connect', () => done(true, 'TCP handshake completed.'));
    socket.once('timeout', () => done(false, 'Connection timed out.'));
    socket.once('error', (error: NodeJS.ErrnoException) => done(false, error.code === 'ECONNREFUSED' ? 'Connection refused by host.' : 'Host did not accept the connection.'));
    socket.connect({ host, port, family: isIP(host) || undefined });
  });
}

async function body(request: NextRequest) {
  const value = await readJsonLimited(request, 8_192);
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new RequestBodyError(400, 'Invalid request body.');
  return value as Record<string, unknown>;
}

async function fetchWithTimeout(url: string, init?: RequestInit, timeout = 6500) {
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeout);
  try { return await fetch(url, { ...init, signal: controller.signal }); } finally { clearTimeout(timer); }
}

type IpWhoResponse = {
  success?: boolean;
  message?: string;
  ip?: string;
  type?: string;
  continent?: string;
  continent_code?: string;
  country?: string;
  country_code?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  postal?: string;
  calling_code?: string;
  connection?: { asn?: number; org?: string; isp?: string; domain?: string };
  timezone?: { id?: string; abbreviation?: string; utc?: string; current_time?: string };
};

async function ipDetails(ip: string) {
  if (!isIP(ip) || !isPublicAddress(ip)) return null;
  try {
    const response = await fetchWithTimeout(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'avrxt.dev network tool' },
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const value = await response.json() as IpWhoResponse;
    if (value.success === false) return null;
    return {
      ip: value.ip || ip,
      version: value.type || (isIP(ip) === 6 ? 'IPv6' : 'IPv4'),
      location: {
        city: value.city || null,
        region: value.region || null,
        postalCode: value.postal || null,
        country: value.country || null,
        countryCode: value.country_code || null,
        continent: value.continent || null,
        continentCode: value.continent_code || null,
        latitude: value.latitude ?? null,
        longitude: value.longitude ?? null,
        callingCode: value.calling_code || null,
      },
      network: {
        isp: value.connection?.isp || null,
        organization: value.connection?.org || null,
        asn: value.connection?.asn ? `AS${value.connection.asn}` : null,
        domain: value.connection?.domain || null,
      },
      timezone: {
        id: value.timezone?.id || null,
        abbreviation: value.timezone?.abbreviation || null,
        utcOffset: value.timezone?.utc || null,
        currentTime: value.timezone?.current_time || null,
      },
    };
  } catch { return null; }
}

export async function GET(request: NextRequest, context: RouteContext<'/api/tools/[tool]'>) {
  const { tool } = await context.params;
  try {
    if (isRateLimited(request.headers, `tool-${tool}`, 30, 60_000)) return json({ error: 'Rate limit reached. Try again in a minute.' }, 429);
    if (tool === 'whatismyip') {
      const ip = clientIp(request);
      const details = await ipDetails(ip);
      return json({
        ip: details?.ip || ip,
        version: details?.version || (isIP(ip) === 6 ? 'IPv6' : isIP(ip) === 4 ? 'IPv4' : 'Unknown'),
        protocol: request.headers.get('x-forwarded-proto') || 'https',
        location: details?.location || {
          city: null,
          region: null,
          postalCode: null,
          country: null,
          countryCode: request.headers.get('cf-ipcountry') || null,
          continent: null,
          continentCode: null,
          latitude: null,
          longitude: null,
          callingCode: null,
        },
        network: details?.network || { isp: null, organization: null, asn: null, domain: null },
        timezone: details?.timezone || { id: null, abbreviation: null, utcOffset: null, currentTime: null },
        userAgent: request.headers.get('user-agent')?.slice(0, 240) || 'Unavailable',
        enriched: Boolean(details),
        source: details ? 'Request headers + ipwho.is' : 'Request headers',
      });
    }
    if (tool === 'quote') {
      const response = await fetchWithTimeout('https://dummyjson.com/quotes/random', { headers: { Accept: 'application/json' }, cache: 'no-store' });
      if (!response.ok) throw new Error('Quote provider unavailable.');
      const value = await response.json() as { quote?: string; author?: string };
      return json({ quote: value.quote, author: value.author, source: 'DummyJSON Quotes' });
    }
    if (tool === 'fontui') {
      if (fontCatalogCache && fontCatalogCache.expiresAt > Date.now()) return json({ fonts: fontCatalogCache.fonts, count: fontCatalogCache.fonts.length });
      try {
        const response = await fetchWithTimeout('https://fonts.google.com/metadata/fonts', { headers: { Accept: 'application/json' }, cache: 'no-store' }, 8000);
        if (!response.ok) throw new Error('Font catalog unavailable.');
        const raw = await response.text();
        const parsed = JSON.parse(raw.replace(/^\)\]\}'\s*/, '')) as { familyMetadataList?: Array<{ family?: string }> };
        const fonts = [...new Set((parsed.familyMetadataList || []).map((item) => item.family).filter((font): font is string => Boolean(font)))].sort((a, b) => a.localeCompare(b));
        if (fonts.length >= 300) fontCatalogCache = { fonts, expiresAt: Date.now() + 86_400_000 };
        return json({ fonts: fonts.length >= 300 ? fonts : FALLBACK_FONTS, count: fonts.length });
      } catch { return json({ fonts: FALLBACK_FONTS, count: FALLBACK_FONTS.length, degraded: true }); }
    }
    return json({ error: 'Tool not found.' }, 404);
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'Tool request failed.' }, 502); }
}

export async function POST(request: NextRequest, context: RouteContext<'/api/tools/[tool]'>) {
  const { tool } = await context.params;
  try {
    if (isRateLimited(request.headers, `tool-${tool}`, tool === 'portcheck' ? 8 : 20, 60_000)) return json({ error: 'Rate limit reached. Try again in a minute.' }, 429);
    const payload = await body(request);
    if (tool === 'portcheck') {
      if (payload.authorized !== true) return json({ error: 'Confirm that you are authorized to test this target.' }, 400);
      const port = Number(payload.port);
      if (!Number.isInteger(port) || port < 1 || port > 65535) return json({ error: 'Port must be an integer from 1 to 65535.' }, 400);
      const target = await resolvePublicHost(String(payload.host || ''));
      const result = await tcpCheck(target.address, port);
      return json({ target: target.host, resolvedAddress: target.address, port, protocol: 'TCP', status: result.open ? 'open' : 'closed-or-filtered', ...result });
    }
    if (tool === 'mailfy') {
      const email = String(payload.email || '').trim().toLowerCase();
      if (email.length > 254 || !/^[^\s@]{1,64}@[^\s@]+\.[^\s@]+$/.test(email)) return json({ valid: false, error: 'Email syntax is invalid.' }, 400);
      const domain = cleanDomain(email.split('@')[1]);
      let mx: Array<{ exchange: string; priority: number }> = [];
      try { mx = (await resolveMx(domain)).sort((a, b) => a.priority - b.priority); } catch { /* reported below */ }
      return json({ email, domain, syntaxValid: true, acceptsMail: mx.length > 0, mx, verdict: mx.length ? 'The domain advertises mail servers. Mailbox existence is not verified.' : 'No MX records were found. The address is unlikely to receive mail.' });
    }
    if (tool === 'dns') {
      const domain = cleanDomain(String(payload.domain || '')); const type = String(payload.type || 'A').toUpperCase();
      if (!DNS_TYPES.has(type)) return json({ error: 'Unsupported DNS record type.' }, 400);
      const dnsResponse = await fetchWithTimeout(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${encodeURIComponent(type)}`, { headers: { Accept: 'application/dns-json' }, cache: 'no-store' });
      if (!dnsResponse.ok) throw new Error('DNS resolver unavailable.');
      const dns = await dnsResponse.json() as { Status?: number; Answer?: Array<{ name: string; type: number; TTL: number; data: string }>; Authority?: unknown };
      let registration: unknown = undefined;
      if (payload.includeRdap === true) {
        try {
          const rdapResponse = await fetchWithTimeout(`https://rdap.org/domain/${encodeURIComponent(domain)}`, { headers: { Accept: 'application/rdap+json, application/json' }, redirect: 'follow', cache: 'no-store' });
          if (rdapResponse.ok) {
            const rdap = await rdapResponse.json() as { handle?: string; ldhName?: string; status?: string[]; events?: Array<{ eventAction?: string; eventDate?: string }>; nameservers?: Array<{ ldhName?: string }>; entities?: Array<{ roles?: string[]; handle?: string }> };
            registration = { handle: rdap.handle, domain: rdap.ldhName, status: rdap.status, events: rdap.events, nameservers: rdap.nameservers?.map((item) => item.ldhName), entities: rdap.entities?.map((item) => ({ handle: item.handle, roles: item.roles })) };
          }
        } catch { registration = { unavailable: true }; }
      }
      return json({ domain, type, resolver: 'Cloudflare 1.1.1.1', status: dns.Status, answers: dns.Answer || [], authority: dns.Authority || [], registration });
    }
    return json({ error: 'Tool not found.' }, 404);
  } catch (error) {
    if (error instanceof RequestBodyError) return json({ error: error.message }, error.status);
    return json({ error: error instanceof Error ? error.message : 'Tool request failed.' }, 400);
  }
}
