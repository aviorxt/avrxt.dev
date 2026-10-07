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
  return configured || 'https://avrxt.dev';
}

export async function POST(request: NextRequest) {
  try {
    if (isRateLimited(request.headers, 'hireme', 5, 60 * 60 * 1000)) {
      return NextResponse.json({ message: 'Too many requests. Please try again later.' }, { status: 429 });
    }
    const body = await readJsonLimited(request, 24_576);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 });
    }
    const payload = body as {
      name?: unknown;
      email?: unknown;
      projectType?: unknown;
      budget?: unknown;
      timeline?: unknown;
      description?: unknown;
    };

    const { name, email, projectType, budget, timeline, description } = payload;

    if ([name, email, projectType, budget, timeline, description].some((value) => typeof value !== 'string' || !value.trim())) {
      return NextResponse.json({ message: 'Missing required payload fields.' }, { status: 400 });
    }

    const cleanName = (name as string).trim().replace(/[\r\n]+/g, ' ');
    const cleanProjectType = (projectType as string).trim().replace(/[\r\n]+/g, ' ');
    const cleanBudget = (budget as string).trim();
    const cleanTimeline = (timeline as string).trim();
    const cleanDescription = (description as string).trim();
    const userEmail = (email as string).trim().toLowerCase();
    if (cleanName.length > 120 || userEmail.length > 254 || cleanProjectType.length > 120 || cleanBudget.length > 80 || cleanTimeline.length > 80 || cleanDescription.length > 8000) {
      return NextResponse.json({ message: 'One or more fields are too long.' }, { status: 400 });
    }
    if (!isValidEmail(userEmail)) {
      return NextResponse.json({ message: 'Invalid email format.' }, { status: 400 });
    }

    const gmailPassword = process.env.GMAIL_APP_PASSWORD;
    const adminEmail = process.env.ADMIN_GMAIL_ID || process.env.ADMIN_EMAIL;

    const warnings: string[] = [];
    let emailSuccess = false;

    // Removed Google Sheets logic as per user request.

    if (gmailPassword && adminEmail) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'aviorxtaero@gmail.com',
            pass: gmailPassword,
          },
        });

        await transporter.sendMail({
          from: '"avrxt_intake" <aviorxtaero@gmail.com>',
          to: adminEmail,
          replyTo: userEmail,
          subject: `NEW_PROJECT: ${cleanProjectType} - ${cleanName}`,
          html: `
            <div style="background:#000; color:#fff; font-family:monospace; padding:30px; border:1px solid #333; max-width:600px; margin:auto;">
              <h2 style="color:#666; font-size:14px; border-bottom:1px solid #222; padding-bottom:10px;">// INTAKE_SIGNAL</h2>
              <p><strong>CLIENT:</strong> ${escapeHtml(cleanName)}</p>
              <p><strong>EMAIL:</strong> ${escapeHtml(userEmail)}</p>
              <p><strong>TYPE:</strong> ${escapeHtml(cleanProjectType)}</p>
              <p><strong>BUDGET:</strong> ${escapeHtml(cleanBudget)}</p>
              <p><strong>TIMELINE:</strong> ${escapeHtml(cleanTimeline)}</p>
              <div style="background:#050505; border:1px solid #222; padding:15px; margin-top:20px; white-space:pre-wrap; color:#ccc; line-height:1.6;">
                ${escapeHtml(cleanDescription)}
              </div>
            </div>
          `,
        });

        emailSuccess = true;
      } catch (mailError) {
        console.error('HIREME_GMAIL_ERROR:', mailError);
        warnings.push('EMAIL_UNAVAILABLE');
      }
    } else {
      warnings.push('EMAIL_CONFIG_MISSING');
    }

    if (emailSuccess) {
      return NextResponse.json({
        message: 'Intake successful.',
        warning: warnings.length ? warnings.join(',') : undefined,
      });
    }

    return NextResponse.json(
      { message: 'TRANSMISSION_DENIED', details: warnings.join(',') || 'No delivery path available.' },
      { status: 503 }
    );
  } catch (error: unknown) {
    if (error instanceof RequestBodyError) return NextResponse.json({ message: error.message }, { status: error.status });
    console.error('HireMe API Error:', error);
    return NextResponse.json({ message: 'SYSTEM_FAILURE' }, { status: 500 });
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
