import { confirmationHash } from './newsletter-confirmation';
import { createAdminClient } from '../utils/supabase/admin';
import { createResendClient, ensureUnsubscribeProperty, issueUnsubscribeLink, removeUnsubscribeLink } from './newsletter-broadcast';
import type { ConfirmationResult } from './newsletter-confirmation-request';
import type { WelcomeDelivery } from './newsletter-welcome';
import { confirmationLinkState, confirmNewsletterOnce } from './newsletter-confirmation-core';

export async function getConfirmationLinkState(token: string) {
  const { data, error } = await createAdminClient().from('newsletter_confirmations').select('confirmed_at,expires_at').eq('token_hash', confirmationHash(token)).maybeSingle();
  if (error) throw new Error('Confirmation lookup failed');
  return confirmationLinkState(data);
}

export async function completeNewsletterConfirmation(token: string, scheduleWelcome?: (delivery: WelcomeDelivery) => void): Promise<ConfirmationResult> {
  const supabase = createAdminClient();
  const hash = confirmationHash(token);
  return confirmNewsletterOnce(hash, {
    find: async () => {
      const { data, error } = await supabase.from('newsletter_confirmations').select('email,audience_id,confirmed_at,expires_at').eq('token_hash', hash).maybeSingle();
      if (error) throw new Error('Confirmation lookup failed');
      return data;
    },
    subscribe: async data => {
      const resend = createResendClient();
      const existing = await resend.contacts.get({ email: data.email, audienceId: data.audience_id });
      if (existing.error && !/not found|does not exist/i.test(existing.error.message)) throw new Error('Subscriber lookup failed');
      await ensureUnsubscribeProperty(resend);
      const link = await issueUnsubscribeLink(data.email, data.audience_id);
      const result = existing.data
        ? await resend.contacts.update({ email: data.email, audienceId: data.audience_id, unsubscribed: false, properties: { UNSUBSCRIBE_URL: link.url } })
        : await resend.contacts.create({ email: data.email, audienceId: data.audience_id, unsubscribed: false, properties: { UNSUBSCRIBE_URL: link.url } });
      if (result.error) { await removeUnsubscribeLink(link.token); throw new Error('Subscriber update failed'); }
      return link.url;
    },
    consume: async () => {
      // Only one concurrent request can consume the token and schedule a welcome.
      const confirmed = await supabase.from('newsletter_confirmations').update({ confirmed_at: new Date().toISOString() }).eq('token_hash', hash).is('confirmed_at', null).select('token_hash').maybeSingle();
      if (confirmed.error) throw new Error('Confirmation save failed');
      return Boolean(confirmed.data);
    },
    scheduleWelcome,
  });
}
