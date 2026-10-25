type TurnstileScope = 'admin' | 'guestbook';

type TurnstileResponse = {
  success?: boolean;
  action?: string;
  hostname?: string;
  'error-codes'?: string[];
};

const configuration = {
  admin: {
    secret: process.env.TURNSTILE_ADMIN_SECRET_KEY,
    siteKey: process.env.NEXT_PUBLIC_TURNSTILE_ADMIN_SITE_KEY,
    action: 'admin_login',
  },
  guestbook: {
    secret: process.env.TURNSTILE_GUESTBOOK_SECRET_KEY,
    siteKey: process.env.NEXT_PUBLIC_TURNSTILE_GUESTBOOK_SITE_KEY,
    action: 'guestbook_write',
  },
} as const;

export function turnstileIsEnabled(scope: TurnstileScope) {
  const config = configuration[scope];
  return Boolean(config.secret && config.siteKey);
}

function clientIp(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || undefined;
}

function trustedHostname(value: unknown) {
  return value === 'www.avrxt.dev' || value === 'avrxt.dev' || (process.env.NODE_ENV !== 'production' && value === 'localhost');
}

export async function verifyTurnstile(scope: TurnstileScope, token: unknown, request: Request) {
  if (!turnstileIsEnabled(scope)) return { success: true as const, enforced: false as const };
  if (typeof token !== 'string' || token.length < 1 || token.length > 2048) return { success: false as const, error: 'TURNSTILE_REQUIRED' };

  const config = configuration[scope];
  const payload = new URLSearchParams({ secret: config.secret!, response: token });
  const ip = clientIp(request);
  if (ip) payload.set('remoteip', ip);

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: payload,
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
    });
    const result = await response.json() as TurnstileResponse;
    if (!response.ok || result.success !== true || result.action !== config.action || !trustedHostname(result.hostname)) {
      return { success: false as const, error: 'TURNSTILE_VERIFICATION_FAILED' };
    }
    return { success: true as const, enforced: true as const };
  } catch {
    return { success: false as const, error: 'TURNSTILE_UNAVAILABLE' };
  }
}
