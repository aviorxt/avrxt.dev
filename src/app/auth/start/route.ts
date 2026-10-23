import { NextRequest, NextResponse } from 'next/server';
import { createDiscordAuthorization, getDiscordCallbackUrl } from '@/lib/discord-auth';
import { safeReturnPath } from '@/lib/auth-redirect';
import { turnstileIsEnabled, verifyTurnstile } from '@/lib/turnstile';
import { isTrustedMutationOrigin } from '@/lib/request-security';

export const dynamic = 'force-dynamic';

async function beginDiscordAuthorization(request: NextRequest, values: URLSearchParams) {
  const provider = values.get('provider');
  const next = safeReturnPath(values.get('next'));
  if (provider !== 'discord') return loginError(request, 'unsupported_provider');
  const callback = getDiscordCallbackUrl(request.url);
  // OAuth must begin on the same canonical host that receives its callback so
  // the browser-bound transaction cookie survives preview-to-production hops.
  if (callback.origin !== request.nextUrl.origin) return NextResponse.redirect(new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, callback.origin));
  try {
    const { url, transaction } = createDiscordAuthorization(request.url, next);
    // The protected form reaches this route with POST. A 307/308 redirect
    // preserves that method, so mobile browsers forward a POST to Discord's
    // authorization endpoint instead of opening it. OAuth authorization is
    // always a top-level GET navigation, hence the explicit 303.
    const response = NextResponse.redirect(url, { status: 303 });
    response.cookies.set('avrxt_oauth_transaction', JSON.stringify(transaction), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/auth', maxAge: 600,
    });
    return response;
  } catch {
    return loginError(request, 'auth_configuration');
  }
}

function canonicalStartRedirect(request: NextRequest) {
  const callback = getDiscordCallbackUrl(request.url);
  if (callback.origin === request.nextUrl.origin) return null;

  const destination = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, callback.origin);
  // Preserve the form body while moving from avrxt.dev to the canonical
  // www.avrxt.dev host. This must happen before Turnstile verification:
  // Turnstile tokens are single-use and cannot be verified on both hosts.
  return NextResponse.redirect(destination, { status: request.method === 'POST' ? 307 : 302 });
}

function loginError(request: NextRequest, error: string) {
  const destination = new URL('/auth/login', request.url);
  destination.searchParams.set('source', 'admin');
  destination.searchParams.set('error', error);
  // Error responses may also originate from the POST form. Do not preserve
  // that method when navigating back to the login screen.
  return NextResponse.redirect(destination, { status: 303 });
}

export async function GET(request: NextRequest) {
  const canonical = canonicalStartRedirect(request);
  if (canonical) return canonical;
  if (!turnstileIsEnabled('admin')) return beginDiscordAuthorization(request, request.nextUrl.searchParams);
  return loginError(request, 'turnstile_required');
}

export async function POST(request: NextRequest) {
  if (!isTrustedMutationOrigin(request)) return loginError(request, 'cross_site_request_rejected');
  const canonical = canonicalStartRedirect(request);
  if (canonical) return canonical;
  const length = Number(request.headers.get('content-length') || 0);
  if (Number.isFinite(length) && length > 8_192) return loginError(request, 'invalid_request');
  const { isRateLimited } = await import('@/lib/api-rate-limit');
  if (await isRateLimited(request.headers, 'admin-auth-start', 10, 10 * 60_000)) return loginError(request, 'rate_limited');
  const form = await request.formData().catch(() => null);
  const values = new URLSearchParams();
  for (const key of ['provider', 'next']) {
    const value = form?.get(key);
    if (typeof value === 'string') values.set(key, value);
  }
  const verification = await verifyTurnstile('admin', form?.get('turnstileToken'), request);
  if (!verification.success) return loginError(request, verification.error.toLowerCase());
  return beginDiscordAuthorization(request, values);
}
