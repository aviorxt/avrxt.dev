import test from 'node:test';
import assert from 'node:assert/strict';
import { databaseMonitorResponse } from '../src/lib/database-monitor';

test('database monitor authenticates before probing and exposes no records or provider errors', async () => {
  const secret = 's'.repeat(64);
  let calls = 0;
  const probe = async () => { calls++; return { error: null, data: [{ id: 'private-row-id' }] }; };
  for (const token of ['', 'Bearer bad', `Bearer ${secret}extra`]) {
    const response = await databaseMonitorResponse(new Request('https://www.avrxt.dev/api/health/database', { headers: { authorization: token } }), secret, probe);
    assert.equal(response.status, 401);
  }
  assert.equal(calls, 0);
  const request = new Request('https://www.avrxt.dev/api/health/database', { headers: { authorization: `Bearer ${secret}` } });
  const success = await databaseMonitorResponse(request, secret, probe);
  assert.deepEqual(await success.json(), { status: 'healthy' }); assert.equal(calls, 1);
  const failure = await databaseMonitorResponse(request, secret, async () => ({ error: { message: 'secret database details' } }));
  assert.equal(failure.status, 503); assert.deepEqual(await failure.json(), { status: 'unavailable' });
  assert.equal(failure.headers.get('cache-control'), 'no-store, max-age=0');
});
