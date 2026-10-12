import { handleConfirmationRequest } from '@/lib/newsletter-confirmation-request';
import { completeNewsletterConfirmation } from '@/lib/confirm-newsletter';
import { isRateLimited } from '@/lib/api-rate-limit';
import { after } from 'next/server';
import { createResendClient } from '@/lib/newsletter-broadcast';
import { deliverWelcomeEmail } from '@/lib/newsletter-welcome';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export async function POST(request: Request) {
  return handleConfirmationRequest(request, {
    rateLimited: headers => isRateLimited(headers, 'newsletter-confirm', 10, 60_000),
    confirm: token => completeNewsletterConfirmation(token, delivery => after(async () => {
      const resend = createResendClient();
      const result = await deliverWelcomeEmail(delivery, (message, options) => resend.emails.send(message, options));
      if (!result.delivered) console.warn('[NEWSLETTER_WELCOME_UNAVAILABLE]', { attempts: result.attempts });
    })),
  });
}
