import type { ConfirmationResult } from './newsletter-confirmation-request';
import type { WelcomeDelivery } from './newsletter-welcome';
export type ConfirmationRecord = { email: string; audience_id: string; confirmed_at: string | null; expires_at: string };
export function confirmationLinkState(record: Pick<ConfirmationRecord, 'confirmed_at' | 'expires_at'> | null, now = Date.now()) {
  if (!record || record.confirmed_at) return 'unavailable' as const;
  if (!Number.isFinite(Date.parse(record.expires_at)) || Date.parse(record.expires_at) < now) return 'expired' as const;
  return 'ready' as const;
}
export async function confirmNewsletterOnce(hash: string, dependencies: {
  find: () => Promise<ConfirmationRecord | null>;
  subscribe: (record: ConfirmationRecord) => Promise<string>;
  consume: () => Promise<boolean>;
  scheduleWelcome?: (delivery: WelcomeDelivery) => void;
}): Promise<ConfirmationResult> {
  const data = await dependencies.find();
  if (!data) return { state: 'unavailable', message: 'This confirmation link is unavailable. Please request a new one.' };
  if (data.confirmed_at) return { state: 'unavailable', message: 'This confirmation link has already been used. Your subscription is active.' };
  if (confirmationLinkState(data) === 'expired') return { state: 'expired', message: 'This link has expired. Subscribe again to receive a fresh confirmation email.' };
  const unsubscribeUrl = await dependencies.subscribe(data);
  if (!await dependencies.consume()) return { state: 'unavailable', message: 'This confirmation link has already been used. Your subscription is active.' };
  dependencies.scheduleWelcome?.({ email: data.email, unsubscribeUrl, confirmationHash: hash });
  return { state: 'confirmed', message: 'Your subscription is confirmed. Welcome to the signal.' };
}
