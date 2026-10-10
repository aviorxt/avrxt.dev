import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { isRateLimited } from '@/lib/api-rate-limit';
import { readJsonLimited, RequestBodyError } from '@/lib/read-json-limited';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getAllowedOrigin(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const origin = request.headers.get('origin');
  if (configured && origin && origin === configured) return origin;
  return configured || 'https://www.avrxt.dev';
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin');
    const allowedOrigin = getAllowedOrigin(request);
    if (origin && origin !== allowedOrigin && origin !== request.nextUrl.origin) {
      return NextResponse.json({ error: 'Cross-site requests are not allowed.' }, { status: 403 });
    }
    if (isRateLimited(request.headers, 'contact', 5, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }
    const body = await readJsonLimited(request, 16_384);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }
    const payload = body as { name?: unknown; email?: unknown; message?: unknown };
    const { name, email, message } = payload;

    if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string' || !name.trim() || !email.trim() || !message.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const userEmail = email.trim().toLowerCase();
    if (userEmail.length > 254 || name.trim().length > 120 || message.trim().length > 5000) {
      return NextResponse.json({ error: 'One or more fields are too long.' }, { status: 400 });
    }
    if (!isValidEmail(userEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const normalizedName = name.trim().replace(/[\r\n]+/g, ' ');
    const safeName = escapeHtml(normalizedName);
    const safeEmail = escapeHtml(userEmail);
    const safeMessage = escapeHtml(message.trim());

    if (!process.env.GMAIL_APP_PASSWORD) {
      return NextResponse.json({ error: 'Contact service is not configured.' }, { status: 503 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'aviorxtaero@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: '"avrxt Terminal" <aviorxtaero@gmail.com>',
      to: 'irgtxpc@gmail.com',
      replyTo: userEmail,
      subject: `NEW_SIGNAL: ${normalizedName}`,
      html: `
          <div style="background:#000; color:#fff; font-family:monospace; padding:30px; border:1px solid #333;">
            <h2 style="color:#666; font-size:14px; border-bottom:1px solid #222; padding-bottom:10px;">// INCOMING_PAYLOAD</h2>
            <p style="margin:20px 0;"><strong>SENDER:</strong> ${safeName}</p>
            <p style="margin:20px 0;"><strong>ADDRESS:</strong> ${safeEmail}</p>
            <div style="background:#050505; border:1px solid #222; padding:15px; margin-top:20px; white-space:pre-wrap; color:#ccc; line-height:1.6;">${safeMessage}</div>
          </div>
      `,
    });

    return NextResponse.json({ success: true, message: 'Signal transmitted.' });
  } catch (error: unknown) {
    if (error instanceof RequestBodyError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('CONTACT_API_ERROR:', error);
    return NextResponse.json({ error: 'SYSTEM_FAILURE' }, { status: 500 });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': getAllowedOrigin(request),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
