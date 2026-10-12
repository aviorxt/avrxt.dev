import { confirmationHash } from './newsletter-confirmation';
import { createAdminClient } from '../utils/supabase/admin';
import { createResendClient, ensureUnsubscribeProperty, issueUnsubscribeLink, removeUnsubscribeLink } from './newsletter-broadcast';
import type { ConfirmationResult } from './newsletter-confirmation-request';

export async function completeNewsletterConfirmation(token: string): Promise<ConfirmationResult> {
  const supabase = createAdminClient();
  const hash = confirmationHash(token);
  const { data, error } = await supabase.from('newsletter_confirmations').select('email,audience_id,confirmed_at,expires_at').eq('token_hash', hash).maybeSingle();
  if (error) throw new Error('Confirmation lookup failed');
  if (!data) return { state: 'unavailable', message: 'This confirmation link is unavailable. Please request a new one.' };
  if (data.confirmed_at) return { state: 'confirmed', message: 'Your subscription is already confirmed. You’re on the list.' };
  if (!Number.isFinite(Date.parse(data.expires_at)) || Date.parse(data.expires_at) < Date.now()) return { state: 'expired', message: 'This link has expired. Subscribe again to receive a fresh confirmation email.' };
  const resend = createResendClient();
  const existing = await resend.contacts.get({ email: data.email, audienceId: data.audience_id });
  if (existing.error && !/not found|does not exist/i.test(existing.error.message)) throw new Error('Subscriber lookup failed');
  await ensureUnsubscribeProperty(resend);
  const link = await issueUnsubscribeLink(data.email, data.audience_id);
  const result = existing.data
    ? await resend.contacts.update({ email: data.email, audienceId: data.audience_id, unsubscribed: false, properties: { UNSUBSCRIBE_URL: link.url } })
    : await resend.contacts.create({ email: data.email, audienceId: data.audience_id, unsubscribed: false, properties: { UNSUBSCRIBE_URL: link.url } });
  if (result.error) { await removeUnsubscribeLink(link.token); throw new Error('Subscriber update failed'); }
  const confirmed = await supabase.from('newsletter_confirmations').update({ confirmed_at: new Date().toISOString() }).eq('token_hash', hash);
  if (confirmed.error) throw new Error('Confirmation save failed');
  return { state: 'confirmed', message: 'Your subscription is confirmed. Welcome to the signal.' };
}
