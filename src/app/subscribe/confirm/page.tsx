import type { Metadata } from 'next';
import ConfirmationClient from './ConfirmationClient';
import { validConfirmationToken } from '@/lib/newsletter-confirmation-request';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Confirm your subscription | avrxt',
  description: 'Confirm your email to receive the avrxt newsletter.',
  robots: { index: false, follow: false },
  referrer: 'same-origin',
};
export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const query = await searchParams;
  return <ConfirmationClient token={validConfirmationToken(query.token) ? query.token : ''} />;
}
