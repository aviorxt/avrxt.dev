import test from 'node:test';
import assert from 'node:assert/strict';
import { handleConfirmationRequest, trustedConfirmationOrigin } from '../src/lib/newsletter-confirmation-request';

const token = 'a'.repeat(43);
function request(origin = 'https://www.avrxt.dev', body = JSON.stringify({ token }), extras: Record<string, string> = {}) {
  return new Request('https://deployment.example/api/subscribe/confirm', { method: 'POST', headers: { origin, 'content-type': 'application/json', 'sec-fetch-site': 'same-origin', ...extras }, body });
}
test('confirmation accepts exact public aliases behind the deployment proxy and rejects opaque/foreign origins', () => {
  assert.equal(trustedConfirmationOrigin(request()), true);
  assert.equal(trustedConfirmationOrigin(request('https://avrxt.dev')), true);
  for (const origin of ['null', '', 'https://evil.example', 'https://www.avrxt.dev.evil.example', 'https://deployment.example']) assert.equal(trustedConfirmationOrigin(request(origin)), false);
  assert.equal(trustedConfirmationOrigin(request('https://www.avrxt.dev', '{}', { 'sec-fetch-site': 'cross-site' })), false);
});
test('rejected origins, malformed tokens and oversized bodies never reach the subscriber provider', async () => {
  let calls = 0;
  const dependencies = { rateLimited: async () => false, confirm: async () => { calls++; return { state: 'confirmed' as const, message: 'Confirmed' }; } };
  assert.equal((await handleConfirmationRequest(request('null'), dependencies)).status, 403);
  assert.equal((await handleConfirmationRequest(request(undefined, '{}'), dependencies)).status, 400);
  assert.equal((await handleConfirmationRequest(request(undefined, 'not JSON'), dependencies)).status, 400);
  assert.equal((await handleConfirmationRequest(request(undefined, JSON.stringify({ token, padding: 'x'.repeat(2000) })), dependencies)).status, 413);
  assert.equal(calls, 0);
});
test('confirmation results and provider outages give bounded page-friendly states without exposing errors', async () => {
  for (const state of ['confirmed', 'expired', 'unavailable'] as const) {
    const response = await handleConfirmationRequest(request(), { rateLimited: async () => false, confirm: async supplied => { assert.equal(supplied, token); return { state, message: state }; } });
    assert.equal(response.status, 200); assert.equal((await response.json()).state, state); assert.equal(response.headers.get('cache-control'), 'no-store');
  }
  const failure = await handleConfirmationRequest(request(), { rateLimited: async () => false, confirm: async () => { throw new Error('private provider credentials'); } });
  assert.equal(failure.status, 503); assert.doesNotMatch(await failure.text(), /private provider credentials/);
});
test('confirmation rate limiting prevents writes and GET cannot confirm a subscriber', async () => {
  let calls = 0;
  const result = await handleConfirmationRequest(request(), { rateLimited: async () => true, confirm: async () => { calls++; return { state: 'confirmed', message: 'done' }; } });
  assert.equal(result.status, 429); assert.equal(calls, 0);
  const get = new Request('https://www.avrxt.dev/subscribe/confirm?token=' + token);
  assert.equal(trustedConfirmationOrigin(get), false);
  const readOnly = await handleConfirmationRequest(get, { rateLimited: async () => false, confirm: async () => { calls++; return { state: 'confirmed', message: 'done' }; } });
  assert.equal(readOnly.status, 405); assert.equal(calls, 0);
});
