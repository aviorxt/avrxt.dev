import { handleUnsubscribeRequest } from '@/lib/unsubscribe-request';
import { stopEmailSubscription } from '@/lib/unsubscribe-data';
import { isRateLimited } from '@/lib/api-rate-limit';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export function POST(request: Request) {
  return handleUnsubscribeRequest(request, {
    rateLimited: headers => isRateLimited(headers, 'newsletter-unsubscribe', 8, 60000),
    unsubscribe: stopEmailSubscription,
  });
}
