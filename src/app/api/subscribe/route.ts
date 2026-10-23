import { resolveMx } from 'node:dns/promises';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { readJsonLimited, RequestBodyError } from '@/lib/read-json-limited';
import { issueConfirmation, confirmationHash } from '@/lib/newsletter-confirmation';
import { createAdminClient } from '@/utils/supabase/admin';
import { isRateLimited } from '@/lib/api-rate-limit';
import { confirmationEmail } from '@/lib/newsletter-emails';
import { isNewsletterEnabled } from '@/lib/public-feature-config';
import { isJsonRequest, isTrustedMutationOrigin } from '@/lib/request-security';

const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID || '';

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  '10minutemail.com',
  'temp-mail.org',
  'throwawaymail.com',
  'yopmail.com',
  'sharklasers.com',
  'dispostable.com',
  'getairmail.com',
  'maildrop.cc',
  'teleworm.us',
  'dayrep.com',
  'rhyta.com',
]);

const PROHIBITED_DOMAINS = ['avrxt.dev', 'avrxt.space', 'aviorxt.aero'];

const BLACKLISTED_EMAILS = new Set(['example@gmail.com', 'spam@gmail.com', 'test@test.com']);

function getAllowedOrigin(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const origin = request.headers.get('origin');
  if (configured && origin && origin === configured) return origin;
  return configured || 'https://www.avrxt.dev';
}

async function isFakeEmail(email: string): Promise<boolean> {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return true;

  if (DISPOSABLE_DOMAINS.has(domain)) return true;

  try {
    const response = await fetch(`https://api.mailcheck.ai/email/${encodeURIComponent(email)}`, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`Mail validation returned ${response.status}`);
    const data = (await response.json()) as { status?: number; disposable?: boolean; mx?: boolean };

    if (data.status === 200 && (data.disposable || !data.mx)) {
      return true;
    }
  } catch {
    // Mail validation is advisory; DNS validation below remains mandatory.
  }

  try {
    const mxRecords = await resolveMx(domain);
    return !mxRecords || mxRecords.length === 0;
  } catch {
    return true;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!await isNewsletterEnabled()) return NextResponse.json({ error: 'NEWSLETTER_SIGNUP_DISABLED' }, { status: 403 });
    if (!isTrustedMutationOrigin(request)) return NextResponse.json({ error: 'CROSS_SITE_REQUEST_REJECTED' }, { status: 403 });
    if (!isJsonRequest(request)) return NextResponse.json({ error: 'UNSUPPORTED_CONTENT_TYPE' }, { status: 415 });
    const body = await readJsonLimited(request, 4096);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'INVALID_REQUEST_BODY' }, { status: 400 });
    }
    const payload = body as { email?: unknown };
    const email = typeof payload.email === 'string' ? payload.email : '';
    if (await isRateLimited(request.headers, 'subscribe', 5, 24 * 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'RATE_LIMIT_EXCEEDED: PLEASE_TRY_AGAIN_TOMORROW' }, { status: 429 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const sanitizedEmail = email.toLowerCase().trim();
    if (!sanitizedEmail || sanitizedEmail.length > 254 || !emailRegex.test(sanitizedEmail)) {
      return NextResponse.json({ error: 'INVALID_EMAIL_FORMAT' }, { status: 400 });
    }

    if (await isRateLimited(request.headers, 'subscribe-email', 1, 10 * 60 * 1000, sanitizedEmail)) {
      return NextResponse.json({ error: 'CHECK_YOUR_INBOX_OR_TRY_AGAIN_LATER' }, { status: 429 });
    }

    const emailDomain = sanitizedEmail.split('@')[1];
    const isProhibited = PROHIBITED_DOMAINS.some((domain) => emailDomain === domain || emailDomain.endsWith(`.${domain}`));

    if (isProhibited) {
      return NextResponse.json({ error: 'YOU ARE NOT ALLOWED TO USE THIS DOMAIN' }, { status: 403 });
    }

    if (BLACKLISTED_EMAILS.has(sanitizedEmail)) {
      return NextResponse.json({ error: 'IDENTITY_BLACKLISTED: ACCESS_DENIED' }, { status: 403 });
    }

    const isFake = await isFakeEmail(sanitizedEmail);
    if (isFake) {
      console.warn('[NEWSLETTER_SIGNUP_REJECTED]', { reason: 'unreliable_domain' });
      return NextResponse.json({ error: 'UPLINK_REJECTED: UNRELIABLE_DOMAIN' }, { status: 403 });
    }

    if (!process.env.RESEND_API_KEY || !AUDIENCE_ID) {
      console.error('RESEND_CONFIG_MISSING');
      return NextResponse.json({ error: 'EMAIL_SERVICE_NOT_CONFIGURED' }, { status: 503 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const confirmation = await issueConfirmation(sanitizedEmail, AUDIENCE_ID);
    const { error: emailError } = await resend.emails.send({
      ...confirmationEmail(confirmation.url),
      to: sanitizedEmail,
    }, { idempotencyKey: `newsletter-confirmation/${confirmationHash(confirmation.token)}` });
    if (emailError) {
      await createAdminClient().from('newsletter_confirmations').delete().eq('token_hash', confirmationHash(confirmation.token));
      throw new Error('Confirmation email failed');
    }
    return NextResponse.json({ message: 'CHECK_YOUR_INBOX_TO_CONFIRM_SUBSCRIPTION' });

  } catch (error) {
    if (error instanceof RequestBodyError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('[NEWSLETTER_SIGNUP_FAILED]');
    return NextResponse.json({ error: 'INTERNAL_SYSTEM_FAILURE' }, { status: 500 });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': getAllowedOrigin(request),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
  }
