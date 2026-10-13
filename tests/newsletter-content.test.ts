import test from 'node:test';
import assert from 'node:assert/strict';
import { appendUnsubscribeFooter, campaignChecks, htmlToPlainText, UNSUBSCRIBE_PROPERTY, UNSUBSCRIBE_VARIABLE } from '../src/lib/newsletter-content';

test('old custom and provider variables migrate while preserving a branded clickable footer', () => {
    assert.equal(UNSUBSCRIBE_PROPERTY, 'AVRXT_UNSUBSCRIBE_URL');
    for (const old of ['UNSUBSCRIBE_URL', 'RESEND_UNSUBSCRIBE_URL', UNSUBSCRIBE_PROPERTY]) {
        const source = `<html><body><div style="color:#aaa"><a href="{{{${old}}}}">Leave newsletter</a></div></body></html>`;
        const prepared = appendUnsubscribeFooter(source);
        assert.match(prepared, /href="\{\{\{contact\.AVRXT_UNSUBSCRIBE_URL\}\}\}"/);
        assert.equal((prepared.match(/<a /g) || []).length, 1);
        assert.equal(appendUnsubscribeFooter(prepared), prepared);
    }
});
test('a variable in prose or comments cannot suppress the compulsory clickable link', () => {
    const prepared = appendUnsubscribeFooter(`<html><body><!-- ${UNSUBSCRIBE_VARIABLE} --><p>Hello</p></body></html>`);
    assert.match(prepared, /<a href="\{\{\{contact\.AVRXT_UNSUBSCRIBE_URL\}\}\}"/);
    assert.ok(prepared.indexOf('Unsubscribe from newsletter updates') < prepared.indexOf('</body>'));
});
test('plain text discards CSS and preserves policy and recipient-specific preference destinations', () => {
    const prepared = appendUnsubscribeFooter('<html><head><title>Hidden title</title><style>@font-face{font-family:Outfit}</style></head><body><h1>Hi &amp; welcome</h1><a href="https://www.avrxt.dev/privacy">Privacy &#8599;</a></body></html>');
    const text = htmlToPlainText(prepared);
    assert.doesNotMatch(text, /font-face|font-family|Hidden title|<a/);
    assert.match(text, /Hi & welcome/);
    assert.match(text, /Privacy ↗ \(https:\/\/www.avrxt.dev\/privacy\)/);
    assert.ok(text.includes(`(${UNSUBSCRIBE_VARIABLE})`));
});
test('preflight prevents the delivered empty-href regression and shared private links', () => {
    assert.ok(campaignChecks('<a href="">Unsubscribe</a>', 'Update', '').errors.length);
    assert.ok(campaignChecks('<a href="https://www.avrxt.dev/preference/mail/unsub/private-token">Leave</a>', 'Update', '').errors.length);
    assert.ok(campaignChecks('<a href="javascript:alert(1)">Go</a>', 'Update', '').errors.length);
    assert.ok(campaignChecks('<p>{{{UNKNOWN}}}</p>', 'Update', '').errors.length);
    assert.deepEqual(campaignChecks('<p>Hello</p>', 'Update', 'News').errors, []);
    assert.ok(campaignChecks('<p>' + 'x'.repeat(103000) + '</p>', 'Update', 'News').warnings.some(w => w.includes('clipped')));
});
test('legacy name and email fields use the documented contact namespace and retain fallbacks', () => {
    const html = appendUnsubscribeFooter('<p>Hi {{{FIRST_NAME|there}}} {{{LAST_NAME}}}: {{{EMAIL}}}</p>');
    assert.ok(html.includes('{{{contact.first_name|there}}}'));
    assert.ok(html.includes('{{{contact.last_name}}}'));
    assert.ok(html.includes('{{{contact.email}}}'));
    assert.deepEqual(campaignChecks(html, 'Update', 'News').errors, []);
});
