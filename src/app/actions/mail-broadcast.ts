'use server';

import { campaignChecks, UNSUBSCRIBE_VARIABLE } from '@/lib/newsletter-content';
import { verifyAdmin } from '@/lib/auth-checks';
import { isRateLimited } from '@/lib/api-rate-limit';
import { headers } from 'next/headers';
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

export async function generateNewsletterEmailAction(input: { prompt: string }) {
    const { authorized } = await verifyAdmin();
    if (!authorized) return { error: 'Unauthorized.' };

    const requestHeaders = await headers();
    if (await isRateLimited(requestHeaders, 'newsletter-ai', 5, 60_000)) {
        return { error: 'Too many AI requests. Please wait a minute and try again.' };
    }

    const secret = process.env.MAIL_AI_SHARED_SECRET?.trim();
    if (!secret) return { error: 'Email AI is not configured yet.' };
    if (!input || typeof input.prompt !== 'string') return { error: 'Describe the email you want to create.' };
    const prompt = input.prompt.trim();
    if (prompt.length < 8 || prompt.length > 2_000) return { error: 'Prompt must be between 8 and 2,000 characters.' };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);
    try {
        const response = await fetch(process.env.MAIL_AI_API_URL || 'https://api.avrxt.dev/v1/mail/generate', {
            method: 'POST',
            headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
            signal: controller.signal,
            cache: 'no-store',
        });
        const result = await response.json().catch(() => null) as {
            draft?: { subject?: unknown; previewText?: unknown; html?: unknown };
            error?: string;
            model?: string;
        } | null;
        if (!response.ok || !result?.draft) {
            if (response.status === 401) {
                console.error('[newsletter-ai] Cloudflare rejected the configured shared secret.');
                return { error: 'Email AI authentication failed. Check that the Vercel and Cloudflare shared secrets match.' };
            }
            if (response.status === 429) return { error: 'Email AI is busy. Please try again shortly.' };
            if (response.status >= 500) {
                console.error(`[newsletter-ai] Cloudflare AI endpoint failed with HTTP ${response.status}.`);
                return { error: 'Cloudflare could not generate the draft. Check the Worker AI binding and its logs.' };
            }
            return { error: result?.error || 'Could not generate the email draft.' };
        }
        const { subject, previewText, html } = result.draft;
        if (typeof subject !== 'string' || typeof previewText !== 'string' || typeof html !== 'string'
            || !subject.trim() || !html.trim() || subject.length > 200 || previewText.length > 240 || html.length > 50_000) {
            return { error: 'The AI returned an invalid draft. Please try a more specific prompt.' };
        }
        return { success: true, draft: { subject: subject.trim(), previewText: previewText.trim(), html: html.trim() }, model: result.model || 'Cloudflare Workers AI' };
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.error('[newsletter-ai] Cloudflare request timed out.');
            return { error: 'Email AI timed out. Please try a shorter prompt and try again.' };
        }
        // Log only a broad failure category. Never log prompts, authorization values, or request headers.
        console.error('[newsletter-ai] Cloudflare endpoint connection failed.', error instanceof Error ? error.name : 'UnknownError');
        return { error: 'Email AI could not connect to Cloudflare. Check MAIL_AI_API_URL and the Vercel function logs.' };
    } finally {
        clearTimeout(timeout);
    }
}

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

        const checks = campaignChecks(html, subject, previewText);
        if (mode !== 'draft' && checks.errors.length) throw new Error(checks.errors.join(' '));
        const resend = createResendClient();
        const audienceId = getNewsletterAudienceId();
        if (input.existingId) {
            const existing = await resend.broadcasts.get(input.existingId);
            if (existing.error) throw new Error(existing.error.message);
            if (existing.data?.audience_id === audienceId && mode !== 'draft' && ['sent', 'scheduled', 'queued'].includes(existing.data.status)) {
                return { success: true, id: input.existingId };
            }
            if (!existing.data || existing.data.audience_id !== audienceId || existing.data.status !== 'draft') {
                throw new Error('Only draft broadcasts in the configured newsletter audience can be updated or sent.');
            }
        }
        let recipientCount: number | undefined;
        if (mode !== 'draft') {
            recipientCount = await syncAudienceUnsubscribeLinks(resend, audienceId);
            if (!recipientCount) throw new Error('No active newsletter contacts. No broadcast was sent.');
        }

        const htmlWithFooter = appendUnsubscribeFooter(html);
        const plainText = htmlToPlainText(htmlWithFooter);
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
            result = await resend.post<{ id: string }>(`/broadcasts/${input.existingId}/send`,
                scheduledAt ? { scheduled_at: scheduledAt } : {}, { headers: { 'Idempotency-Key': idempotencyKey } });
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
        const checks = campaignChecks(input.html, input.subject, 'Test');
        if (checks.errors.length) throw new Error(checks.errors.join(' '));
        const unsubscribeLink = await issueTestUnsubscribeLink(to);
        testToken = unsubscribeLink.token;
        const testHtml = appendUnsubscribeFooter(input.html, 'test')
            .split(UNSUBSCRIBE_VARIABLE).join(unsubscribeLink.url)
            .replace(/\{\{\{contact\.first_name(?:\|[^}]*)?\}\}\}/g, 'Test reader')
            .replace(/\{\{\{contact\.last_name(?:\|[^}]*)?\}\}\}/g, 'Reader')
            .replace(/\{\{\{contact\.email\}\}\}/g, to);
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
