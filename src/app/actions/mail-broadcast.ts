'use server';

import { verifyAdmin } from '@/lib/auth-checks';
import {
    appendUnsubscribeFooter,
    createResendClient,
    getNewsletterAudienceId,
    htmlToPlainText,
    issueTestUnsubscribeLink,
    removeUnsubscribeLink,
    syncAudienceUnsubscribeLinks,
    validateBroadcastFrom,
} from '@/lib/newsletter-broadcast';

export async function createNewsletterBroadcastAction(input: {
    name: string;
    from: string;
    replyTo: string;
    subject: string;
    previewText: string;
    html: string;
    mode: 'draft' | 'send' | 'schedule';
    scheduledAt?: string;
    idempotencyKey: string;
    existingId?: string;
}) {
    const { authorized } = await verifyAdmin();
    if (!authorized) return { error: 'Unauthorized.' };
    try {
        if (!input || typeof input !== 'object') throw new Error('Invalid broadcast payload.');
        const name = typeof input.name === 'string' ? input.name.trim().slice(0, 120) : '';
        const subject = typeof input.subject === 'string' ? input.subject.trim().slice(0, 200) : '';
        const previewText = typeof input.previewText === 'string' ? input.previewText.trim().slice(0, 240) : '';
        const html = typeof input.html === 'string' ? input.html.trim() : '';
        const replyTo = typeof input.replyTo === 'string' ? input.replyTo.trim() : '';
        const idempotencyKey = typeof input.idempotencyKey === 'string' ? input.idempotencyKey : '';
        if (!name || !subject || !html || html.length > 500_000) throw new Error('Campaign name, subject, and HTML are required (HTML limit: 500 KB).');
        if (/[\r\n]/.test(subject) || /[\r\n]/.test(replyTo)) throw new Error('Subject and reply-to cannot contain line breaks.');
        if (!/^[a-zA-Z0-9-]{16,80}$/.test(idempotencyKey)) throw new Error('Invalid send confirmation key.');
        const from = validateBroadcastFrom(typeof input.from === 'string' ? input.from : '');
        if (replyTo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo)) throw new Error('Enter a valid reply-to email address.');

        const mode = input.mode;
        if (!['draft', 'send', 'schedule'].includes(mode)) throw new Error('Invalid campaign mode.');
        let scheduledAt: string | undefined;
        if (mode === 'schedule') {
            const date = new Date(input.scheduledAt || '');
            if (!Number.isFinite(date.getTime()) || date.getTime() < Date.now() + 5 * 60 * 1000) {
                throw new Error('Choose a scheduled time at least five minutes from now.');
            }
            scheduledAt = date.toISOString();
        }

        const resend = createResendClient();
        const audienceId = getNewsletterAudienceId();
        if (input.existingId) {
            const existing = await resend.broadcasts.get(input.existingId);
            if (existing.error) throw new Error(existing.error.message);
            if (!existing.data || existing.data.audience_id !== audienceId || existing.data.status !== 'draft') {
                throw new Error('Only draft broadcasts in the configured newsletter audience can be updated or sent.');
            }
        }
        let recipientCount: number | undefined;
        if (mode !== 'draft') recipientCount = await syncAudienceUnsubscribeLinks(resend, audienceId);

        const htmlWithFooter = appendUnsubscribeFooter(html);
        const plainText = `${htmlToPlainText(html)}\n\nUnsubscribe: {{{UNSUBSCRIBE_URL}}}`;
        const payload = {
            name,
            from,
            ...(replyTo ? { replyTo } : {}),
            subject,
            ...(previewText ? { previewText } : {}),
            html: htmlWithFooter,
            text: plainText,
        };

        let result: Awaited<ReturnType<typeof resend.broadcasts.send>>;
        if (input.existingId) {
            const { replyTo: _replyTo, ...updatePayload } = payload;
            const updated = await resend.broadcasts.update(input.existingId, {
                ...updatePayload,
                ...(replyTo ? { replyTo: [replyTo] } : {}),
                audienceId,
            });
            if (updated.error) throw new Error(updated.error.message);
            if (mode === 'draft') return { success: true, id: input.existingId, recipientCount };
            result = await resend.broadcasts.send(input.existingId, scheduledAt ? { scheduledAt } : undefined);
        } else {
            result = await resend.broadcasts.create({
                audienceId,
                ...payload,
                ...(mode === 'draft'
                    ? { send: false as const }
                    : { send: true as const, ...(scheduledAt ? { scheduledAt } : {}) }),
            }, { headers: { 'Idempotency-Key': idempotencyKey } });
        }

        if (result.error) throw new Error(result.error.message);
        return { success: true, id: result.data?.id, recipientCount };
    } catch (error) {
        return { error: error instanceof Error ? error.message : 'Could not create broadcast.' };
    }
}

export async function getNewsletterBroadcastAction(id: string) {
    const { authorized } = await verifyAdmin();
    if (!authorized) return { error: 'Unauthorized.' };
    if (typeof id !== 'string' || !/^[a-zA-Z0-9-]{10,80}$/.test(id)) return { error: 'Invalid broadcast ID.' };
    try {
        const resend = createResendClient();
        const result = await resend.broadcasts.get(id);
        if (result.error) throw new Error(result.error.message);
        if (!result.data || result.data.audience_id !== getNewsletterAudienceId() || result.data.status !== 'draft') {
            throw new Error('Only draft broadcasts in the configured newsletter audience can be edited here.');
        }
        return {
            success: true,
            broadcast: {
                id: result.data.id,
                name: result.data.name || '',
                from: result.data.from || '',
                replyTo: result.data.reply_to?.[0] || '',
                subject: result.data.subject || '',
                previewText: result.data.preview_text || '',
                html: result.data.html || '',
            },
        };
    } catch (error) {
        return { error: error instanceof Error ? error.message : 'Could not load broadcast.' };
    }
}

export async function sendNewsletterTestAction(input: { from: string; to: string; subject: string; html: string }) {
    const { authorized } = await verifyAdmin();
    if (!authorized) return { error: 'Unauthorized.' };
    let testToken: string | undefined;
    try {
        if (!input || typeof input !== 'object') throw new Error('Invalid test email payload.');
        const from = validateBroadcastFrom(input.from);
        const to = input.to.trim().toLowerCase();
        if (to.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) throw new Error('Enter a valid test recipient address.');
        if (!input.subject.trim() || /[\r\n]/.test(input.subject) || !input.html.trim() || input.html.length > 500_000) throw new Error('Enter a valid subject and HTML (HTML limit: 500 KB).');
        const unsubscribeLink = await issueTestUnsubscribeLink(to);
        testToken = unsubscribeLink.token;
        const testHtml = appendUnsubscribeFooter(input.html, 'test')
            .replace(/\{\{\{UNSUBSCRIBE_URL\}\}\}/g, unsubscribeLink.url);
        const resend = createResendClient();
        const result = await resend.emails.send({
            from,
            to,
            subject: `[TEST] ${input.subject.trim().slice(0, 190)}`,
            html: testHtml,
            text: `${htmlToPlainText(testHtml)}\n\nUnsubscribe: ${unsubscribeLink.url}`,
        });
        if (result.error) throw new Error(result.error.message);
        return { success: true };
    } catch (error) {
        if (testToken) await removeUnsubscribeLink(testToken);
        return { error: error instanceof Error ? error.message : 'Could not send test email.' };
    }
}

export async function getRecentNewsletterBroadcastsAction() {
    const { authorized } = await verifyAdmin();
    if (!authorized) return { error: 'Unauthorized.' };
    try {
        const resend = createResendClient();
        const result = await resend.broadcasts.list({ limit: 10 });
        if (result.error) throw new Error(result.error.message);
        const audienceId = getNewsletterAudienceId();
        return { success: true, broadcasts: (result.data?.data || []).filter(item => item.audience_id === audienceId || item.segment_id === audienceId) };
    } catch (error) {
        return { error: error instanceof Error ? error.message : 'Could not load recent broadcasts.' };
    }
}
