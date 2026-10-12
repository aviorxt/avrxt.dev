import test from 'node:test';
import assert from 'node:assert/strict';
import { confirmationEmail, welcomeEmail, CONFIRMATION_FROM, WELCOME_FROM } from '../src/lib/newsletter-emails';
import { deliverWelcomeEmail } from '../src/lib/newsletter-welcome';
import { confirmNewsletterOnce, confirmationLinkState } from '../src/lib/newsletter-confirmation-core';

test('newsletter templates use requested senders, safe URLs, doodles, fonts, plain text and opt-out', () => {
  const confirmation = confirmationEmail('https://www.avrxt.dev/subscribe/confirm?token=abc&extra=def');
  const welcome = welcomeEmail('https://unsub.avrxt.dev/mail/example');
  assert.equal(confirmation.from, CONFIRMATION_FROM); assert.match(confirmation.from, /confirm@avrxt.dev/);
  assert.equal(welcome.from, WELCOME_FROM); assert.match(welcome.from, /info@avrxt.dev/);
  assert.match(confirmation.html, /confirmation-doodle\.png/); assert.match(welcome.html, /welcome-doodle\.png/);
  assert.match(confirmation.html, /Outfit-Variable\.ttf/); assert.match(confirmation.html, /&amp;extra=def/);
  assert.match(welcome.html, /Unsubscribe from avrxt emails/); assert.match(welcome.text, /https:\/\/unsub.avrxt.dev\/mail\/example/);
  for (const message of [confirmation, welcome]) { assert.match(message.html, /role="presentation"/); assert.doesNotMatch(message.html, /<script|<form|<iframe|data:/i); assert.ok(message.text.length > 200); }
  assert.throws(() => confirmationEmail('javascript:alert(1)'));
});
test('welcome delivery retries the exact payload once per confirmation with a stable provider idempotency key', async () => {
  const payloads: string[] = [], keys: string[] = [];
  const delivery = { email: 'fixture@example.com', unsubscribeUrl: 'https://unsub.avrxt.dev/mail/fixture', confirmationHash: 'a'.repeat(64) };
  const result = await deliverWelcomeEmail(delivery, async (message, options) => {
    payloads.push(JSON.stringify(message)); keys.push(options.idempotencyKey);
    return payloads.length === 1 ? { data: null, error: { name: 'rate_limit_exceeded' } } : { data: { id: 'fixture' }, error: null };
  }, async () => {});
  assert.deepEqual(result, { delivered: true, attempts: 2 }); assert.equal(payloads[0], payloads[1]); assert.equal(keys[0], keys[1]);
  const permanent = await deliverWelcomeEmail(delivery, async () => ({ data: null, error: { name: 'validation_error' } }), async () => {});
  assert.deepEqual(permanent, { delivered: false, attempts: 1 });
});
test('confirmation consumes its token atomically and schedules welcome only for the winning transition', async () => {
  let confirmed = false, loseRace = false, subscriberWrites = 0, welcomes = 0;
  const record = () => ({ email: 'fixture@example.com', audience_id: 'fixture-audience', confirmed_at: confirmed ? new Date().toISOString() : null, expires_at: new Date(Date.now() + 3600000).toISOString() });
  const dependencies = {
    find: async () => record(),
    subscribe: async () => { subscriberWrites++; return 'https://unsub.avrxt.dev/mail/fixture'; },
    consume: async () => { if (loseRace || confirmed) return false; confirmed = true; return true; },
    scheduleWelcome: () => { assert.equal(confirmed, true); welcomes++; },
  };
  const first = await confirmNewsletterOnce('a'.repeat(64), dependencies);
  assert.equal(first.state, 'confirmed'); assert.equal(welcomes, 1);
  const repeated = await confirmNewsletterOnce('a'.repeat(64), dependencies);
  assert.equal(repeated.state, 'unavailable'); assert.equal(welcomes, 1); assert.equal(subscriberWrites, 1);
  assert.equal(confirmationLinkState(record()), 'unavailable');
  confirmed = false; loseRace = true;
  const raced = await confirmNewsletterOnce('a'.repeat(64), dependencies);
  assert.equal(raced.state, 'unavailable'); assert.equal(welcomes, 1);
  assert.equal(confirmationLinkState({ confirmed_at: null, expires_at: 'invalid' }), 'expired');
});
