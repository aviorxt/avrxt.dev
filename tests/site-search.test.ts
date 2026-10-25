import test from 'node:test';
import assert from 'node:assert/strict';
import { documentSearchRecord, fetchSearch, parseSearchHits, localSearch, PUBLIC_SEARCH_PAGES } from '../src/lib/site-search';
import type { DocArticle } from '../src/lib/docs-config';
import { waitForSearchTask } from '../src/lib/search-task';

test('search accepts only public destinations and treats provider HTML as text', () => {
  const title = '<img src=x onerror=alert(1)>';
  const raw = ['/me/admin', '/docs/admin', '/docs/ADMIN', '//evil.test', 'https://www.avrxt.dev/contact', '/docs/%61dmin', '/docs/foo?next=x', '/docs/../admin', '/auth/start', '/storage', '/tools/unknown'].map(href => ({ href, title }));
  assert.deepEqual(parseSearchHits(raw), []);
  assert.deepEqual(parseSearchHits([{ href: '/contact', title, _highlightResult: { title: { value: '<script>bad</script>' } } }, { href: '/contact', title: 'duplicate' }]), [{ objectID: '/contact', href: '/contact', title, description: '', category: 'site' }]);
  assert.ok(PUBLIC_SEARCH_PAGES.every(page => !page.href.includes('admin')));
  assert.equal(localSearch('terminal')[0].href, '/terminal');
});
test('index records omit drafts, auth metadata and oversized content', () => {
  const doc = { id: 'example', slug: 'example-note', title: 'Example', published: true, content: 'x'.repeat(20000), tags: ['public'], author: 'private identity' } as DocArticle;
  assert.equal(documentSearchRecord({ ...doc, published: false }), null);
  assert.equal(documentSearchRecord({ ...doc, slug: 'admin' }), null);
  const record = documentSearchRecord(doc)!;
  assert.equal(record.content?.length, 1500);
  assert.equal('author' in record, false);
  assert.equal(Buffer.byteLength(JSON.stringify(record)) < 10000, true);
});
test('browser search bounds requests, disables analytics and uses only its supplied search key', async () => {
  const config = { appId: 'ABC1234567', index: 'avrxt_public', key: 'a'.repeat(32) };
  let calls = 0;
  const request: typeof fetch = async (url, options) => {
    calls++;
    assert.equal(url, 'https://ABC1234567-dsn.algolia.net/1/indexes/avrxt_public/query');
    assert.equal(options?.credentials, 'omit');
    const body = JSON.parse(options?.body as string);
    assert.equal(body.query.length, 120);
    assert.equal(body.hitsPerPage, 10);
    assert.equal(body.analytics, false); assert.equal(body.clickAnalytics, false);
    assert.equal('userToken' in body, false);
    return Response.json({ hits: [{ title: 'Contact', href: '/contact' }, { title: 'Admin', href: '/me/admin' }] });
  };
  const hits = await fetchSearch('x'.repeat(200), config, new AbortController().signal, request);
  assert.equal(hits.length, 1);
  await assert.rejects(fetchSearch('x', { ...config, appId: 'evil.test/' }, new AbortController().signal, request));
  assert.equal(calls, 1);
});

test('index synchronization waits for delayed publishing with bounded backoff', async () => {
  let elapsed = 0;
  let requests = 0;
  const options = { now: () => elapsed, pause: async (ms: number) => { elapsed += ms; } };
  await waitForSearchTask(async timeout => {
    requests++;
    assert.ok(timeout > 0 && timeout <= 5000);
    return { status: elapsed >= 12_000 ? 'published' : 'notPublished' };
  }, options);
  assert.ok(elapsed >= 12_000 && elapsed < 25_000);
  assert.ok(requests < 20);
  elapsed = 0;
  await assert.rejects(waitForSearchTask(async () => ({ status: 'notPublished' }), options), /timed out/);
  assert.equal(elapsed, 25_000);
});
