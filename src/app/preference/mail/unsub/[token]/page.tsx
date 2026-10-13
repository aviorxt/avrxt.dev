import { headers } from 'next/headers';
import { isRateLimited } from '@/lib/api-rate-limit';
import { loadEmailPreferences } from '@/lib/unsubscribe-data';
import { validUnsubscribeToken, type PreferenceResult } from '@/lib/unsubscribe-core';
import PreferenceClient from '../PreferenceClient';
export const dynamic = 'force-dynamic';
export default async function EmailPreferences({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let initial: PreferenceResult | { state: 'error' } = { state: 'unavailable' };
  if (validUnsubscribeToken(token)) {
    try {
      if (await isRateLimited(await headers(), 'newsletter-preferences-view', 120, 60000)) initial = { state: 'error' };
      else initial = await loadEmailPreferences(token);
    } catch { initial = { state: 'error' }; }
  }
  return <PreferenceClient token={initial.state === 'ready' || initial.state === 'error' ? token : ''} initial={initial} />;
}
