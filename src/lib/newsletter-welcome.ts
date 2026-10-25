import { welcomeEmail } from './newsletter-emails';

export type WelcomeDelivery = { email: string; unsubscribeUrl: string; confirmationHash: string };
type Sender = (message: ReturnType<typeof welcomeEmail> & { to: string }, options: { idempotencyKey: string }) => Promise<{ error: { name: string } | null; data: unknown }>;
// Retry the exact payload with one provider idempotency key. Recipient, token
// and provider error messages must never enter application logs.
export async function deliverWelcomeEmail(delivery: WelcomeDelivery, send: Sender,
  wait: (ms: number) => Promise<void> = ms => new Promise(resolve => setTimeout(resolve, ms))) {
  const message = { ...welcomeEmail(delivery.unsubscribeUrl), to: delivery.email };
  const options = { idempotencyKey: `newsletter-welcome/${delivery.confirmationHash}` };
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await send(message, options);
      if (!result.error && result.data) return { delivered: true, attempts: attempt };
      if (result.error && /validation|invalid|restricted|missing|idempotency/i.test(result.error.name)) return { delivered: false, attempts: attempt };
    } catch { /* retry bounded network failures with the same idempotency key */ }
    if (attempt < 3) await wait(attempt * 300);
  }
  return { delivered: false, attempts: 3 };
}
