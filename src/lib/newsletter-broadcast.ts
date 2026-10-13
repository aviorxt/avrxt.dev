import { createHash, randomBytes } from 'node:crypto';
import { Resend } from 'resend';
import { createAdminClient } from '@/utils/supabase/admin';
import { makeUnsubscribeUrl } from './unsubscribe-core';
export { makeUnsubscribeUrl } from './unsubscribe-core';

import { UNSUBSCRIBE_PROPERTY } from './newsletter-content';
export { UNSUBSCRIBE_PROPERTY, appendUnsubscribeFooter, htmlToPlainText } from './newsletter-content';
export const TEST_UNSUBSCRIBE_AUDIENCE_ID = '__avrxt_test__';

export function createResendClient() {
    const key = process.env.RESEND_API_KEY?.trim();
    if (!key) throw new Error('RESEND_API_KEY is not configured.');
    return new Resend(key);
}

export function getNewsletterAudienceId() {
    const id = process.env.RESEND_AUDIENCE_ID?.trim();
    if (!id) throw new Error('RESEND_AUDIENCE_ID is not configured.');
    return id;
}

function hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
}

export async function issueUnsubscribeLink(email: string, audienceId: string) {
    const token = randomBytes(32).toString('base64url');
    const supabase = createAdminClient();
    const { error } = await supabase.from('newsletter_unsubscribe_tokens').insert({
        token_hash: hashToken(token),
        email: email.trim().toLowerCase(),
        audience_id: audienceId,
    });
    if (error) throw new Error(`Could not create unsubscribe link: ${error.message}`);
    return { token, url: makeUnsubscribeUrl(token) };
}

export async function issueTestUnsubscribeLink(email: string) {
    const token = randomBytes(32).toString('base64url');
    const supabase = createAdminClient();
    const { error } = await supabase.from('newsletter_unsubscribe_tokens').insert({
        token_hash: hashToken(token),
        email: email.trim().toLowerCase(),
        audience_id: TEST_UNSUBSCRIBE_AUDIENCE_ID,
    });
    if (error) throw new Error(`Could not create test unsubscribe link: ${error.message}`);
    return { token, url: makeUnsubscribeUrl(token) };
}

export async function removeUnsubscribeLink(token: string) {
    const supabase = createAdminClient();
    await supabase.from('newsletter_unsubscribe_tokens').delete().eq('token_hash', hashToken(token));
}

export async function ensureUnsubscribeProperty(resend: Resend) {
    let after: string | undefined;
    do {
        const result = await resend.contactProperties.list({ limit: 100, ...(after ? { after } : {}) });
        if (result.error) throw new Error(`Could not inspect Resend contact properties: ${result.error.message}`);
        const property = result.data?.data.find(property => property.key === UNSUBSCRIBE_PROPERTY);
        if (property) {
            if (property.type !== 'string') throw new Error('The website unsubscribe contact property must be a string.');
            return;
        }
        after = result.data?.data.at(-1)?.id;
        if (!result.data?.has_more) break;
    } while (after);

    const created = await resend.contactProperties.create({ key: UNSUBSCRIBE_PROPERTY, type: 'string' });
    if (created.error && !created.error.message.toLowerCase().includes('already exists')) {
        throw new Error(`Could not create the unsubscribe contact property: ${created.error.message}`);
    }
}

export async function syncAudienceUnsubscribeLinks(resend: Resend, audienceId: string) {
    await ensureUnsubscribeProperty(resend);
    let after: string | undefined;
    const contacts: Array<{ email: string; token: string; url: string }> = [];
    do {
        const page = await resend.contacts.list({ audienceId, limit: 100, ...(after ? { after } : {}) });
        if (page.error) throw new Error(`Could not load newsletter subscribers: ${page.error.message}`);
        const pageContacts = page.data?.data || [];
        for (const contact of pageContacts) {
            if (contact.unsubscribed) continue;
            const token = randomBytes(32).toString('base64url');
            contacts.push({ email: contact.email, token, url: makeUnsubscribeUrl(token) });
        }
        after = pageContacts.at(-1)?.id;
        if (!page.data?.has_more) break;
    } while (after);

    if (!contacts.length) return 0;

    const supabase = createAdminClient();
    const records = contacts.map(contact => ({
        token_hash: hashToken(contact.token),
        email: contact.email.trim().toLowerCase(),
        audience_id: audienceId,
    }));
    for (let offset = 0; offset < records.length; offset += 500) {
        const { error } = await supabase.from('newsletter_unsubscribe_tokens').insert(records.slice(offset, offset + 500));
        if (error) throw new Error(`Could not store unsubscribe links: ${error.message}`);
    }

    const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csv = [
        ['Email', 'Unsubscribe URL'].map(csvCell).join(','),
        ...contacts.map(contact => [contact.email, contact.url].map(csvCell).join(',')),
    ].join('\n');
    const imported = await resend.contacts.imports.create({
        file: new Blob([csv], { type: 'text/csv' }),
        columnMap: {
            email: 'Email',
            properties: { [UNSUBSCRIBE_PROPERTY]: { column: 'Unsubscribe URL', type: 'string' } },
        },
        onConflict: 'upsert',
        segments: [{ id: audienceId }],
    });
    if (imported.error || !imported.data?.id) {
        throw new Error(`Could not provision broadcast unsubscribe links: ${imported.error?.message || 'Resend returned no import ID.'}`);
    }

    const deadline = Date.now() + 180_000;
    while (Date.now() < deadline) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const status = await resend.contacts.imports.get(imported.data.id);
        if (status.error) throw new Error(`Could not check unsubscribe-link import: ${status.error.message}`);
        if (status.data?.status === 'failed') throw new Error('Resend could not finish provisioning unsubscribe links. No broadcast was sent.');
        if (status.data?.status === 'completed') {
            if (status.data.counts.failed > 0 || status.data.counts.skipped > 0 || status.data.counts.total !== contacts.length) {
                throw new Error(`Resend provisioned ${status.data.counts.updated + status.data.counts.created} of ${contacts.length} unsubscribe links. No broadcast was sent.`);
            }
            // Import completion alone does not prove the personalization property exists.
            // Check the actual stored value for every intended recipient; never log it.
            for (const contact of contacts) {
                await new Promise(resolve => setTimeout(resolve, 550));
                const saved = await resend.contacts.get({ email: contact.email });
                if (saved.error || saved.data?.properties?.[UNSUBSCRIBE_PROPERTY]?.value !== contact.url) {
                    throw new Error('A website unsubscribe link could not be verified. No broadcast was sent.');
                }
            }
            return contacts.length;
        }
    }
    throw new Error('Unsubscribe-link provisioning is still running. No broadcast was sent; retry after Resend finishes the contact import.');
}

export function validateBroadcastFrom(from: string) {
    const value = from.trim();
    if (!value || /[\r\n]/.test(value)) throw new Error('Enter a valid From address.');
    const match = value.match(/^(?:[^<>]*<)?([^\s<>@]+@[^\s<>@]+\.[^\s<>@]+)>?$/);
    if (!match) throw new Error('Use a sender like "avrxt Updates <news@avrxt.dev>".');

    const address = match[1];
    const domain = address.split('@')[1].toLowerCase();
    const allowedDomains = (process.env.RESEND_FROM_DOMAINS || 'avrxt.dev')
        .split(',')
        .map(item => item.trim().toLowerCase().replace(/^@/, ''))
        .filter(Boolean);
    if (!allowedDomains.some(allowed => domain === allowed || domain.endsWith(`.${allowed}`))) {
        throw new Error(`Sender domain ${domain} is not in RESEND_FROM_DOMAINS.`);
    }
    return value;
}
