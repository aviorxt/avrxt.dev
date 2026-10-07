import { findUnsubscribeRecord } from '@/lib/newsletter-broadcast';
import UnsubscribeClient from './UnsubscribeClient';

export const dynamic = 'force-dynamic';
export const metadata = {
    title: 'Email preferences | avrxt',
    robots: { index: false, follow: false },
};

export default async function NewsletterUnsubscribePage({ params }: { params: Promise<{ key: string }> }) {
    const { key } = await params;
    let valid = false;
    let alreadyUnsubscribed = false;
    try {
        const record = await findUnsubscribeRecord(key);
        valid = !!record;
        alreadyUnsubscribed = !!record?.unsubscribed_at;
    } catch (error) {
        console.error('[NEWSLETTER_UNSUBSCRIBE_LOOKUP_FAILED]', error);
    }

    return <UnsubscribeClient token={valid ? key : ''} alreadyUnsubscribed={alreadyUnsubscribed} />;
}
