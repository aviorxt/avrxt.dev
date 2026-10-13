import 'server-only';
import { createHash } from 'node:crypto';
import { createAdminClient } from '@/utils/supabase/admin';
import { createResendClient } from './newsletter-broadcast';
import { preferenceState, unsubscribeOnce, validUnsubscribeToken, type UnsubscribeRecord } from './unsubscribe-core';

async function find(token: string): Promise<UnsubscribeRecord | null> {
  const hash = createHash('sha256').update(token).digest('hex');
  const { data, error } = await createAdminClient().from('newsletter_unsubscribe_tokens')
    .select('email,audience_id,unsubscribed_at').eq('token_hash', hash).abortSignal(AbortSignal.timeout(5000)).maybeSingle();
  if (error) throw new Error('Unsubscribe lookup unavailable');
  if (!data) return null;
  if (typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || data.email.length > 320
    || typeof data.audience_id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(data.audience_id)
    || (data.unsubscribed_at !== null && typeof data.unsubscribed_at !== 'string')) throw new Error('Invalid unsubscribe record');
  return data;
}
export async function loadEmailPreferences(token: string) {
  if (!validUnsubscribeToken(token)) return preferenceState(null);
  return preferenceState(await find(token));
}
export function stopEmailSubscription(token: string) {
  return unsubscribeOnce(token, {
    find,
    stopNewsletter: async record => {
      const result = await createResendClient().contacts.update({ email: record.email, audienceId: record.audience_id, unsubscribed: true });
      if (result.error) throw new Error('Newsletter update unavailable');
    },
    markComplete: async record => {
      const { error } = await createAdminClient().from('newsletter_unsubscribe_tokens').update({ unsubscribed_at: new Date().toISOString() })
        .eq('email', record.email).eq('audience_id', record.audience_id).is('unsubscribed_at', null).abortSignal(AbortSignal.timeout(5000));
      if (error) throw new Error('Unsubscribe completion unavailable');
    },
  });
}
