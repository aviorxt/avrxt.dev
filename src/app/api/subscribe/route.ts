import { resolveMx } from 'node:dns/promises';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { LRUCache } from 'lru-cache';
import { Resend } from 'resend';
import { readJsonLimited, RequestBodyError } from '@/lib/read-json-limited';
import { ensureUnsubscribeProperty, issueUnsubscribeLink, removeUnsubscribeLink, makeUnsubscribeUrl } from '@/lib/newsletter-broadcast';

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

const rateLimit = new LRUCache<string, number>({
  max: 1000,
  ttl: 1000 * 60 * 60 * 24,
});

function getAllowedOrigin(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const origin = request.headers.get('origin');
  if (configured && origin && origin === configured) return origin;
  return configured || 'https://www.avrxt.dev';
}

function getClientIp(headerList: Headers): string {
  const cf = headerList.get('cf-connecting-ip');
  if (cf) return cf;

  const realIp = headerList.get('x-real-ip');
  if (realIp) return realIp;

  return 'anonymous';
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
  } catch (error) {
    console.error('[SECURITY_API_LOG] External validation bypassed due to error:', error);
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
    const body = await readJsonLimited(request, 4096);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'INVALID_REQUEST_BODY' }, { status: 400 });
    }
    const payload = body as { email?: unknown };
    const email = typeof payload.email === 'string' ? payload.email : '';
    const headerList = await headers();
    const ip = getClientIp(headerList);

    const attempts = rateLimit.get(ip) || 0;
    if (attempts >= 5) {
      return NextResponse.json({ error: 'RATE_LIMIT_EXCEEDED: PLEASE_TRY_AGAIN_TOMORROW' }, { status: 429 });
    }
    rateLimit.set(ip, attempts + 1);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const sanitizedEmail = email.toLowerCase().trim();
    if (!sanitizedEmail || sanitizedEmail.length > 254 || !emailRegex.test(sanitizedEmail)) {
      return NextResponse.json({ error: 'INVALID_EMAIL_FORMAT' }, { status: 400 });
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
      console.warn(`[SHIELD_TRIGGERED] Blocked fake identity: ${sanitizedEmail}`);
      return NextResponse.json({ error: 'UPLINK_REJECTED: UNRELIABLE_DOMAIN' }, { status: 403 });
    }

    if (!process.env.RESEND_API_KEY || !AUDIENCE_ID) {
      console.error('RESEND_CONFIG_MISSING');
      return NextResponse.json({ error: 'EMAIL_SERVICE_NOT_CONFIGURED' }, { status: 503 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data: existingContact, error: contactLookupError } = await resend.contacts.get({ email: sanitizedEmail, audienceId: AUDIENCE_ID });
    if (contactLookupError && !/not found|does not exist/i.test(contactLookupError.message)) {
      throw new Error(contactLookupError.message);
    }
    if (existingContact && !existingContact.unsubscribed) {
      return NextResponse.json({ error: 'YOU ARE ALREADY SUBSCRIBED' }, { status: 409 });
    }

    await ensureUnsubscribeProperty(resend);
    const unsubscribeLink = await issueUnsubscribeLink(sanitizedEmail, AUDIENCE_ID);
    const contactResult = existingContact
      ? await resend.contacts.update({
          email: sanitizedEmail,
          audienceId: AUDIENCE_ID,
          unsubscribed: false,
          properties: { UNSUBSCRIBE_URL: unsubscribeLink.url },
        })
      : await resend.contacts.create({
          email: sanitizedEmail,
          unsubscribed: false,
          audienceId: AUDIENCE_ID,
          properties: { UNSUBSCRIBE_URL: unsubscribeLink.url },
        });
    const createError = contactResult.error;

    if (createError) {
      await removeUnsubscribeLink(unsubscribeLink.token);
      if (createError.message.toLowerCase().includes('already exists')) {
        return NextResponse.json({ error: 'YOU ARE ALREADY SUBSCRIBED' }, { status: 409 });
      }
      throw new Error(createError.message);
    }

    const { error: emailError } = await resend.emails.send({
      from: 'avrxt.dev <Notify@AvrXt.dev>',
      to: sanitizedEmail,
      subject: 'Connection Established: Welcome to avrxt.dev',
      html: `
        <div style="background-color: #000; color: #fff; padding: 40px; font-family: Arial, sans-serif; max-width: 500px; margin: auto; border: 1px solid #1a1a1a; border-radius: 24px; text-align: center;">
          <h1 style="font-size: 24px; font-weight: 900; margin-bottom: 16px;">Greetings, avrxt</h1>
          <p style="color: #a1a1aa; line-height: 1.6; margin-bottom: 32px;">
            Welcome to <strong>avrxt.dev</strong>. You are now successfully subscribed to the avrxt mailing list.
          </p>
          <div style="border-top: 1px solid #1a1a1a; padding-top: 24px; margin-top: 24px;">
            <p style="font-size: 14px; color: #666; margin-bottom: 4px;">Best regards @avrxt</p>
            <a href="https://www.avrxt.dev" style="color: #fff; text-decoration: none; font-size: 12px; font-weight: 700;">www.avrxt.dev</a>
            <p style="font-size: 12px; color: #777; margin-top: 20px;"><a href="${makeUnsubscribeUrl(unsubscribeLink.token)}" style="color: #aaa;">Unsubscribe from avrxt emails</a></p>
          </div>
        </div>
      `,
    });

    if (emailError) {
      console.error('EMAIL_DISPATCH_ERROR:', emailError);
      return NextResponse.json({ message: 'SUCCESSFULLY_SUBSCRIBED', warning: 'WELCOME_EMAIL_DELAYED' });
    }

    return NextResponse.json({ message: 'SUCCESSFULLY_SUBSCRIBED' });
  } catch (error) {
    if (error instanceof RequestBodyError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('CRITICAL_SUBSCRIBE_ERROR:', error);
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
