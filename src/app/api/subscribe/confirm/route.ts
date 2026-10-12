import { handleConfirmationRequest } from '@/lib/newsletter-confirmation-request';
import { completeNewsletterConfirmation } from '@/lib/confirm-newsletter';
import { isRateLimited } from '@/lib/api-rate-limit';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  return handleConfirmationRequest(request, {
    rateLimited: headers => isRateLimited(headers, 'newsletter-confirm', 10, 60_000),
    confirm: completeNewsletterConfirmation,
  });
}
