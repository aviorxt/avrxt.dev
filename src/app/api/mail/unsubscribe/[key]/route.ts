import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/utils/supabase/admin';
import { findUnsubscribeRecord } from '@/lib/newsletter-broadcast';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(_request: Request, { params }: { params: Promise<{ key: string }> }) {
    const { key } = await params;
    try {
        const record = await findUnsubscribeRecord(key);
        if (!record) return NextResponse.json({ error: 'INVALID_UNSUBSCRIBE_LINK' }, { status: 404 });
        if (record.unsubscribed_at) return NextResponse.json({ success: true });

        const apiKey = process.env.RESEND_API_KEY?.trim();
        if (!apiKey) return NextResponse.json({ error: 'EMAIL_SERVICE_UNAVAILABLE' }, { status: 503 });
        const resend = new Resend(apiKey);
        const result = await resend.contacts.update({
            email: record.email,
            audienceId: record.audience_id,
            unsubscribed: true,
        });
        if (result.error) {
            console.error('[NEWSLETTER_UNSUBSCRIBE_RESEND_FAILED]', result.error);
            return NextResponse.json({ error: 'EMAIL_PREFERENCE_UPDATE_FAILED' }, { status: 503 });
        }

        const supabase = createAdminClient();
        const { error } = await supabase
            .from('newsletter_unsubscribe_tokens')
            .update({ unsubscribed_at: new Date().toISOString() })
            .eq('email', record.email)
            .is('unsubscribed_at', null);
        if (error) {
            console.error('[NEWSLETTER_UNSUBSCRIBE_DB_FAILED]', error);
            return NextResponse.json({ error: 'EMAIL_PREFERENCE_UPDATE_FAILED' }, { status: 503 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[NEWSLETTER_UNSUBSCRIBE_FAILED]', error);
        return NextResponse.json({ error: 'EMAIL_PREFERENCE_UPDATE_FAILED' }, { status: 503 });
    }
}
