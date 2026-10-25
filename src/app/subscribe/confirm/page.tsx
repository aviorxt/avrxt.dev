import type { Metadata } from 'next';
import ConfirmationClient from './ConfirmationClient';
import { validConfirmationToken } from '@/lib/newsletter-confirmation-request';
import { getConfirmationLinkState } from '@/lib/confirm-newsletter';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Confirm your subscription | avrxt',
  description: 'Confirm your email to receive the avrxt newsletter.',
  robots: { index: false, follow: false },
  referrer: 'same-origin',
};
export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const query = await searchParams;
  const token = validConfirmationToken(query.token) ? query.token : '';
  let initialState: 'ready' | 'expired' | 'unavailable' | 'error' = 'unavailable';
  if (token) {
    try { initialState = await getConfirmationLinkState(token); }
    catch { initialState = 'error'; }
  }
  return <ConfirmationClient token={initialState === 'ready' || initialState === 'error' ? token : ''} initialState={initialState} />;
}
