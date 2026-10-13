import test from 'node:test';
import assert from 'node:assert/strict';
import bridge from '../unsubscribe-worker/worker';
import { makeUnsubscribeUrl, preferenceState, unsubscribeOnce, type UnsubscribeRecord } from '../src/lib/unsubscribe-core';
import { handleUnsubscribeRequest } from '../src/lib/unsubscribe-request';
const token = 'a'.repeat(43);
const record: UnsubscribeRecord = { email: 'fixture@example.com', audience_id: 'fixture', unsubscribed_at: null };
const request = (origin = 'https://www.avrxt.dev', body = JSON.stringify({ token })) => new Request('https://deployment.example/api/newsletter/unsubscribe', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'same-origin' }, body });

test('new unsubscribe links always use the canonical Next.js route, including with obsolete Worker configuration', () => {
  const previous = process.env.NEWSLETTER_UNSUBSCRIBE_BASE_URL; process.env.NEWSLETTER_UNSUBSCRIBE_BASE_URL = 'https://unsub.avrxt.dev';
  try { assert.equal(makeUnsubscribeUrl(token), `https://www.avrxt.dev/preferance/mail/unsub/${token}`); assert.throws(() => makeUnsubscribeUrl('<script>')); }
  finally { if (previous === undefined) delete process.env.NEWSLETTER_UNSUBSCRIBE_BASE_URL; else process.env.NEWSLETTER_UNSUBSCRIBE_BASE_URL = previous; }
});
test('old email links redirect safely and never call a provider or perform an unsubscribe', async () => {
  const previous = globalThis.fetch; let calls = 0; globalThis.fetch = async () => { calls++; throw new Error('Unexpected provider access'); };
  try {
    for (const method of ['GET','HEAD','POST']) {
      const response = await bridge.fetch(new Request(`https://unsub.avrxt.dev/mail/${token}?next=https://evil.example`, { method }));
      assert.equal(response.status, method === 'POST' ? 303 : 302); assert.equal(response.headers.get('location'), makeUnsubscribeUrl(token));
      assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
    }
    assert.equal((await bridge.fetch(new Request('https://unsub.avrxt.dev/mail/%ZZ'))).status, 404);
    assert.equal((await bridge.fetch(new Request(`https://unsub.avrxt.dev/mail/${token}`, { method: 'DELETE' }))).status, 405);
    assert.equal(calls, 0);
  } finally { globalThis.fetch = previous; }
});
test('preference reads expose only state and completed links never issue writes', async () => {
  assert.deepEqual(preferenceState(null), { state: 'unavailable' });
  const read = preferenceState(record); assert.deepEqual(read, { state: 'ready', isTest: false }); assert.ok(!JSON.stringify(read).includes(record.email));
  let writes = 0;
  const completed = await unsubscribeOnce(token, { find: async () => ({ ...record, unsubscribed_at: new Date().toISOString() }), stopNewsletter: async () => { writes++; }, markComplete: async () => { writes++; } });
  assert.equal(completed.state, 'unsubscribed'); assert.equal(writes, 0);
});
test('real unsubscribe updates Resend before marking matching links complete; test tokens skip Resend', async () => {
  const order: string[] = [];
  const dependencies = { find: async () => record, stopNewsletter: async () => { order.push('resend'); }, markComplete: async () => { order.push('database'); } };
  assert.equal((await unsubscribeOnce(token, dependencies)).state, 'unsubscribed'); assert.deepEqual(order, ['resend','database']);
  order.length = 0;
  assert.equal((await unsubscribeOnce(token, { ...dependencies, find: async () => ({ ...record, audience_id: '__avrxt_test__' }) })).state, 'test_confirmed'); assert.deepEqual(order, ['database']);
});
test('provider failure never records an unsubscribe, and invalid/missing tokens never reach writes', async () => {
  let writes = 0;
  const dependencies = { find: async () => record, stopNewsletter: async () => { throw new Error('fixture provider unavailable'); }, markComplete: async () => { writes++; } };
  await assert.rejects(unsubscribeOnce(token, dependencies)); assert.equal(writes, 0);
  assert.equal((await unsubscribeOnce('invalid', dependencies)).state, 'unavailable');
  assert.equal((await unsubscribeOnce(token, { ...dependencies, find: async () => null })).state, 'unavailable'); assert.equal(writes, 0);
});
test('website API rejects cross-site, opaque-origin, invalid and oversized requests before unsubscribe', async () => {
  let writes = 0; const dependencies = { rateLimited: async () => false, unsubscribe: async () => { writes++; return { state: 'unsubscribed' as const }; } };
  for (const origin of ['https://evil.example', 'null', 'https://deployment.example']) assert.equal((await handleUnsubscribeRequest(request(origin), dependencies)).status, 403);
  assert.equal((await handleUnsubscribeRequest(request(undefined, '{}'), dependencies)).status, 400);
  assert.equal((await handleUnsubscribeRequest(request(undefined, JSON.stringify({ token, padding: 'a'.repeat(2000) })), dependencies)).status, 413);
  assert.equal((await handleUnsubscribeRequest(new Request('https://www.avrxt.dev/api/newsletter/unsubscribe'), dependencies)).status, 405); assert.equal(writes, 0);
});
test('website unsubscribe provides private results, bounds attempts and sanitizes provider errors', async () => {
  let calls = 0;
  const dependencies = { rateLimited: async () => false, unsubscribe: async (value: string) => { assert.equal(value, token); calls++; return { state: 'unsubscribed' as const }; } };
  const success = await handleUnsubscribeRequest(request(), dependencies); assert.equal(success.status, 200); assert.equal((await success.json()).state, 'unsubscribed'); assert.match(success.headers.get('cache-control')!, /no-store/);
  assert.equal((await handleUnsubscribeRequest(request(), { ...dependencies, rateLimited: async () => true })).status, 429); assert.equal(calls, 1);
  const failed = await handleUnsubscribeRequest(request(), { ...dependencies, unsubscribe: async () => { throw new Error('private credentials and subscriber address'); } });
  assert.equal(failed.status, 503); assert.doesNotMatch(await failed.text(), /private credentials/);
});
