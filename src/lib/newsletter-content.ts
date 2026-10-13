// Shared by the browser preview and server sender. UNSUBSCRIBE_URL is reserved
// by Resend; use a dedicated custom contact property instead.
export const UNSUBSCRIBE_PROPERTY = 'AVRXT_UNSUBSCRIBE_URL';
export const UNSUBSCRIBE_VARIABLE = `{{{contact.${UNSUBSCRIBE_PROPERTY}}}}`;
export const PREVIEW_UNSUBSCRIBE_URL = 'https://www.avrxt.dev/preference/mail/unsub/' + 'a'.repeat(43);

export function normalizeUnsubscribeVariables(html: string) {
    return html.replace(/\{\{\{(?:contact\.)?(?:RESEND_UNSUBSCRIBE_URL|UNSUBSCRIBE_URL|AVRXT_UNSUBSCRIBE_URL)\}\}\}/g, UNSUBSCRIBE_VARIABLE)
        .replace(/\{\{\{(FIRST_NAME|LAST_NAME|EMAIL)(\|[^}]*)?\}\}\}/g, (_all, key: string, fallback: string = '') => `{{{contact.${key.toLowerCase()}${fallback}}}}`);
}

export function appendUnsubscribeFooter(html: string, variant: 'broadcast' | 'test' = 'broadcast') {
    const content = normalizeUnsubscribeVariables(html);
    // A placeholder in a comment or prose is not a clickable unsubscribe link.
    if (/<a\b[^>]*\bhref\s*=\s*["']\{\{\{contact\.AVRXT_UNSUBSCRIBE_URL\}\}\}["'][^>]*>\s*[^<\s][\s\S]*?<\/a\s*>/i.test(content)) return content;
    const message = variant === 'test'
        ? 'This test link checks the preference flow without changing newsletter membership.'
        : 'You are receiving this email because you subscribed to avrxt updates.';
    const footer = `<div style="max-width:600px;margin:24px auto;padding:24px;background:#0b0b0b;border:1px solid #282828;text-align:center;font-family:Arial,sans-serif;font-size:12px;line-height:1.7;color:#aaaaaa">${message}<br><a href="${UNSUBSCRIBE_VARIABLE}" style="display:inline-block;padding:12px 6px;color:#efefef;text-decoration:underline">${variant === 'test' ? 'Verify test preference link' : 'Unsubscribe from newsletter updates'}</a><br><a href="https://www.avrxt.dev/privacy" style="color:#aaaaaa;text-decoration:underline">Privacy</a> · <a href="mailto:support@avrxt.dev" style="color:#aaaaaa;text-decoration:underline">Contact</a></div>`;
    return /<\/body\s*>/i.test(content) ? content.replace(/<\/body\s*>/i, `${footer}</body>`)
        : /<\/html\s*>/i.test(content) ? content.replace(/<\/html\s*>/i, `${footer}</html>`) : `${content}\n${footer}`;
}

export function htmlToPlainText(html: string) {
    return html
        .replace(/<(head|style|script)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<a\b[^>]*href\s*=\s*["']([^"']*)["'][^>]*>([\s\S]*?)<\/a\s*>/gi, (_all, href: string, label: string) => `${label.replace(/<[^>]*>/g, '')}${href ? ` (${href})` : ''}`)
        .replace(/<\s*br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&#(x[0-9a-f]+|\d+);/gi, (_all, code: string) => {
            const value = code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code);
            return value <= 0x10ffff && value >= 0 ? String.fromCodePoint(value) : '';
        })
        .replace(/&(nbsp|amp|lt|gt|quot|apos|middot|ndash|mdash);/gi, (_all, key: string) => ({ nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", middot: '·', ndash: '–', mdash: '—' }[key.toLowerCase()] || ''))
        .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n\n').trim();
}

export function campaignChecks(html: string, subject: string, previewText: string) {
    const errors: string[] = [], warnings: string[] = [];
    const normalized = appendUnsubscribeFooter(html);
    if (!subject.trim() || !html.trim()) errors.push('Add a subject and email content.');
    if (/<(?:script|iframe|form|object|embed)\b|\son\w+\s*=/i.test(html)) errors.push('Remove scripts, forms, embeds, and event handlers.');
    if (/(?:href|src)\s*=\s*["']\s*(?:javascript:|data:|https?:\/\/["'])/i.test(html)) errors.push('Fix unsafe or unfinished link/image URLs.');
    if (/href\s*=\s*["']\s*["']/i.test(html)) errors.push('Fix empty links before sending.');
    if (/href\s*=\s*["']https:\/\/(?:unsub\.avrxt\.dev\/mail\/|www\.avrxt\.dev\/(?:preference|preferance)\/mail\/unsub\/)/i.test(html)) errors.push('Replace a copied personal unsubscribe URL with the Website unsubscribe variable.');
    const variables = [...normalized.matchAll(/\{\{\{([^}]+)\}\}\}/g)].map(match => match[1].split('|')[0]);
    const unsupported = variables.filter(key => !['contact.first_name', 'contact.last_name', 'contact.email', `contact.${UNSUBSCRIBE_PROPERTY}`].includes(key));
    if (unsupported.length) errors.push(`Unsupported personalization: ${[...new Set(unsupported)].join(', ')}.`);
    if (!previewText.trim()) warnings.push('Add an inbox preview to explain the message.');
    if (new TextEncoder().encode(normalized).length > 100_000) warnings.push('Email exceeds 100 KB and may be clipped by some inboxes.');
    if (/<img\b(?![^>]*\balt\s*=)[^>]*>/i.test(html)) warnings.push('Add alt text to every image.');
    if (/href\s*=\s*["']http:\/\//i.test(html)) warnings.push('Use HTTPS links where available.');
    return { errors, warnings, bytes: new TextEncoder().encode(normalized).length };
}
