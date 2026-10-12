import { createHmac, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';

export function clientAddress(headers: Headers): string {
  const secret = process.env.GATEWAY_SHARED_SECRET || process.env.MAIL_AI_SHARED_SECRET;
  const ip = headers.get('x-avrxt-client-ip') || '';
  const timestamp = headers.get('x-avrxt-client-time') || '';
  const signature = headers.get('x-avrxt-client-signature') || '';
  if (secret && isIP(ip) && /^\d{13}$/.test(timestamp) && Math.abs(Date.now() - Number(timestamp)) < 60_000 && /^[a-f0-9]{64}$/.test(signature)) {
    const expected = createHmac('sha256', secret).update(`${timestamp}\n${ip}`).digest();
    if (timingSafeEqual(expected, Buffer.from(signature, 'hex'))) return ip;
  }
  // Trust only the header supplied by the configured ingress. Direct origin
  // access must be blocked before enabling Cloudflare header trust.
  const value = process.env.VERCEL
    ? headers.get('x-vercel-forwarded-for') || headers.get('x-forwarded-for')
    : process.env.TRUST_CLOUDFLARE_PROXY === 'true' ? headers.get('cf-connecting-ip') : null;
  const address = value?.split(',')[0].trim() || '';
  return isIP(address) ? address : 'unknown';
}
