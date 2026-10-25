import test from 'node:test';
import assert from 'node:assert/strict';
import { parseStatusSnapshot, serviceState, historyWindow } from '../src/lib/status-model';
import { loadPublicStatus } from '../src/lib/status-fetch';

const now = new Date('2026-10-12T12:00:00Z');
const entity = (id: string, type: string, attributes: Record<string, unknown>, relationships = {}) => ({ id, type, attributes, relationships });
const fixture = {
  data: entity('page', 'status_page', { aggregate_state: 'operational', private_token: 'do not expose' }),
  included: [
    entity('section', 'status_page_section', { name: 'Core' }),
    entity('monitor', 'status_page_resource', { public_name: 'Web', resource_type: 'Monitor', status_page_section_id: 'section', status: 'operational', availability: .9995, private_url: 'internal.example', status_history: [{ day: '2026-10-10', status: 'not_monitored' }, { day: '2026-10-11', status: 'downtime', downtime_duration: 120 }, { day: '2026-10-13', status: 'operational' }] }),
    entity('manual', 'status_page_resource', { public_name: 'Discord', resource_type: 'ManuallyTrackedItem', status: 'operational', availability: 1 }),
    entity('maintenance', 'status_report', { report_type: 'maintenance', title: 'Scheduled work', starts_at: '2026-10-13T10:00:00Z', ends_at: '2026-10-13T11:00:00Z', aggregate_state: 'maintenance' }),
    entity('active', 'status_report', { title: 'Database issue', starts_at: '2026-10-12T11:00:00Z', aggregate_state: 'downtime', affected_resources: [{ status_page_resource_id: 'monitor' }] }, { status_updates: { data: [{ id: 'update', type: 'status_update' }] } }),
    entity('update', 'status_update', { message: '<img src=x onerror=alert(1)> investigating', published_at: '2026-10-12T11:30:00Z', private_note: 'internal' }),
    entity('done', 'status_report', { title: 'Resolved event', starts_at: '2026-10-01', ends_at: '2026-10-02', aggregate_state: 'resolved' }),
    entity('private', 'status_report', { published: false, title: 'Private draft' }),
  ],
};
test('public status keeps history gaps and manual entries separate from measured uptime', () => {
  const result = parseStatusSnapshot(fixture, now);
  assert.equal(result.resources[0].uptime, 99.95);
  assert.equal(result.resources[1].uptime, null);
  assert.equal(result.resources[0].history.length, 2);
  const days = historyWindow(result.resources[0].history, 30, now);
  assert.equal(days.length, 30);
  assert.equal(days.at(-1)?.monitored, false);
  assert.equal(days.find(day => day.day === '2026-10-11')?.downtime, 120);
  assert.equal(days.find(day => day.day === '2026-10-10')?.monitored, false);
  assert.equal(JSON.stringify(result).includes('private_token'), false);
  assert.equal(JSON.stringify(result).includes('internal.example'), false);
});
test('public reports classify scheduled, active and resolved events and whitelist timeline fields', () => {
  const result = parseStatusSnapshot(fixture, now);
  assert.equal(result.reports.find(report => report.id === 'maintenance')?.phase, 'upcoming');
  assert.equal(result.reports.find(report => report.id === 'active')?.phase, 'active');
  assert.equal(result.reports.find(report => report.id === 'done')?.phase, 'resolved');
  assert.equal(result.reports.some(report => report.id === 'private'), false);
  assert.deepEqual(result.reports.find(report => report.id === 'active')?.affected, ['Web']);
  assert.equal(result.reports.find(report => report.id === 'active')?.updates[0].message, '<img src=x onerror=alert(1)> investigating');
  assert.equal(JSON.stringify(result).includes('private_note'), false);
  assert.equal(serviceState('nonsense'), 'unknown');
  assert.equal(serviceState('under_maintenance'), 'maintenance');
  assert.throws(() => parseStatusSnapshot({ data: {} }, now));
});
test('status transport uses fixed public sources without credentials and reports outages honestly', async () => {
  let calls = 0;
  const request: typeof fetch = async (url, options) => {
    calls++;
    assert.ok(['https://avrxt-dev.betteruptime.com/index.json', 'https://status.avrxt.dev/index.json'].includes(String(url)));
    assert.equal(new Headers(options?.headers).has('authorization'), false);
    assert.equal(options?.redirect, 'error');
    return calls === 1 ? new Response('bad', { status: 503 }) : Response.json(fixture);
  };
  const result = await loadPublicStatus(request);
  assert.equal(result.available, true); assert.equal(calls, 2);
  const failed = await loadPublicStatus(async () => Response.json({ unexpected: 'shape' }));
  assert.equal(failed.status, 'unknown'); assert.equal(failed.available, false);
  assert.deepEqual(failed.resources, []);
  const oversized = await loadPublicStatus(async () => new Response('x', { headers: { 'content-length': '2000001' } }));
  assert.equal(oversized.available, false);
});
