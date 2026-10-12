import { randomBytes, createHash } from 'node:crypto';
import { createAdminClient } from '@/utils/supabase/admin';

export function confirmationHash(token: string) { return createHash('sha256').update(token).digest('hex'); }
export async function issueConfirmation(email: string, audienceId: string) {
  const token = randomBytes(32).toString('base64url');
  const supabase = createAdminClient();
  await supabase.from('newsletter_confirmations').delete().lt('expires_at', new Date().toISOString());
  const { error } = await supabase.from('newsletter_confirmations').insert({
    token_hash: confirmationHash(token), email, audience_id: audienceId,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });
  if (error) throw new Error('Could not create subscription confirmation.');
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.avrxt.dev';
  return { token, url: new URL(`/subscribe/confirm?token=${token}`, origin).toString() };
}
