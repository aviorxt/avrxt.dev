export type ServiceState = 'operational' | 'degraded' | 'down' | 'maintenance' | 'unknown';
export type HistoryDay = { day: string; status: ServiceState; monitored: boolean; downtime: number; maintenance: number };
export type StatusResource = { id: string; name: string; description: string; section: string; status: ServiceState; uptime: number | null; automatic: boolean; history: HistoryDay[] };
export type StatusReport = { id: string; title: string; kind: 'incident' | 'maintenance'; phase: 'active' | 'upcoming' | 'resolved' | 'completed'; status: ServiceState; startsAt: string | null; endsAt: string | null; affected: string[]; updates: { message: string; at: string | null }[] };
export type StatusSnapshot = { status: ServiceState; label: string; checkedAt: string; available: boolean; announcement: string; resources: StatusResource[]; reports: StatusReport[] };
type Entity = { id: string; type: string; attributes: Record<string, unknown>; relationships?: Record<string, { data?: { id: string; type: string }[] }> };
const text = (value: unknown, limit = 500) => typeof value === 'string' ? value.slice(0, limit).trim() : '';
const date = (value: unknown) => typeof value === 'string' && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
const seconds = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.min(value, 86400) : 0;
export function serviceState(value: unknown): ServiceState {
  switch (text(value).toLowerCase().replace(/[\s-]/g, '_')) {
    case 'operational': case 'resolved': return 'operational';
    case 'degraded': case 'degraded_performance': return 'degraded';
    case 'down': case 'downtime': case 'partial_outage': case 'major_outage': return 'down';
    case 'maintenance': case 'under_maintenance': return 'maintenance';
    default: return 'unknown';
  }
}
export const STATUS_LABELS: Record<ServiceState, string> = { operational: 'All systems operational', degraded: 'Some services are degraded', down: 'Service disruption', maintenance: 'Maintenance in progress', unknown: 'Status temporarily unavailable' };
export function unavailableStatus(now = new Date()): StatusSnapshot {
  return { status: 'unknown', label: STATUS_LABELS.unknown, checkedAt: now.toISOString(), available: false, announcement: '', resources: [], reports: [] };
}
function entities(input: unknown): Entity[] {
  return Array.isArray(input) ? input.slice(0, 2000).filter(item => item && typeof item.id === 'string' && typeof item.type === 'string' && item.attributes && typeof item.attributes === 'object') : [];
}
export function parseStatusSnapshot(input: unknown, now = new Date()): StatusSnapshot {
  const raw = input as { data?: Entity; included?: unknown } | null;
  if (!raw?.data || raw.data.type !== 'status_page' || !raw.data.attributes) throw new Error('Invalid public status source');
  const included = entities(raw.included);
  const sections = new Map(included.filter(item => item.type === 'status_page_section').map(item => [item.id, text(item.attributes.name, 100)]));
  const sectionPositions = new Map(included.filter(item => item.type === 'status_page_section').map(item => [item.id, Number(item.attributes.position || 0)]));
  const resources = included.filter(item => item.type === 'status_page_resource').sort((a, b) => (sectionPositions.get(String(a.attributes.status_page_section_id)) || 0) - (sectionPositions.get(String(b.attributes.status_page_section_id)) || 0) || Number(a.attributes.position || 0) - Number(b.attributes.position || 0)).slice(0, 50).map(item => {
    const a = item.attributes;
    const automatic = ['Monitor', 'Heartbeat', 'MonitorGroup', 'HeartbeatGroup'].includes(text(a.resource_type));
    const availability = typeof a.availability === 'number' && Number.isFinite(a.availability) && a.availability >= 0 && a.availability <= 100 ? a.availability : null;
    const history = new Map<string, HistoryDay>();
    if (Array.isArray(a.status_history)) for (const day of a.status_history.slice(-100)) {
      if (!day || typeof day.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day.day) || date(day.day)?.slice(0, 10) !== day.day || day.day > now.toISOString().slice(0, 10)) continue;
      const status = serviceState(day.status);
      history.set(day.day, { day: day.day, status, monitored: status !== 'unknown' && day.status !== 'not_monitored', downtime: seconds(day.downtime_duration), maintenance: seconds(day.maintenance_duration) });
    }
    return { id: item.id.slice(0, 100), name: text(a.public_name, 120) || 'Unnamed service', description: text(a.explanation), section: automatic ? sections.get(String(a.status_page_section_id)) || 'Services' : 'Dependencies', status: serviceState(a.status), automatic, uptime: automatic && availability !== null ? availability <= 1 ? availability * 100 : availability : null, history: [...history.values()].sort((a, b) => a.day.localeCompare(b.day)).slice(-90) };
  });
  const names = new Map(resources.map(resource => [resource.id, resource.name]));
  const updates = new Map(included.filter(item => item.type === 'status_update').map(item => [item.id, item]));
  const reports: StatusReport[] = included.filter(item => item.type === 'status_report' && item.attributes.published !== false).slice(0, 100).map(item => {
    const a = item.attributes;
    const kind = a.report_type === 'maintenance' ? 'maintenance' as const : 'incident' as const;
    const startsAt = date(a.starts_at), endsAt = date(a.ends_at);
    const status = serviceState(a.aggregate_state);
    const ended = endsAt && Date.parse(endsAt) <= now.getTime() || kind === 'incident' && status === 'operational';
    const phase = ended ? kind === 'maintenance' ? 'completed' as const : 'resolved' as const : startsAt && Date.parse(startsAt) > now.getTime() ? 'upcoming' as const : 'active' as const;
    const linked = Array.isArray(item.relationships?.status_updates?.data) ? item.relationships.status_updates.data : [];
    return { id: item.id.slice(0, 100), title: text(a.title, 200) || 'Service update', kind, phase, status, startsAt, endsAt,
      affected: Array.isArray(a.affected_resources) ? a.affected_resources.slice(0, 50).flatMap(resource => resource && typeof resource === 'object' && 'status_page_resource_id' in resource && names.has(String(resource.status_page_resource_id)) ? names.get(String(resource.status_page_resource_id))! : []) : [],
      updates: linked.slice(-25).flatMap(ref => { const update = updates.get(ref.id); return update ? [{ message: text(update.attributes.message, 4000), at: date(update.attributes.published_at) }] : []; }).sort((a, b) => (b.at || '').localeCompare(a.at || '')),
    };
  }).sort((a, b) => (b.startsAt || '').localeCompare(a.startsAt || ''));
  const status = serviceState(raw.data.attributes.aggregate_state);
  return { status, label: STATUS_LABELS[status], available: true, checkedAt: now.toISOString(), announcement: text(raw.data.attributes.announcement, 2000), resources, reports };
}
export function historyWindow(history: HistoryDay[], days: 7 | 30 | 90, now: Date) {
  const entries = new Map(history.map(day => [day.day, day]));
  return Array.from({ length: days }, (_, index) => {
    const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - days + index + 1)).toISOString().slice(0, 10);
    return entries.get(day) || { day, status: 'unknown' as const, monitored: false, downtime: 0, maintenance: 0 };
  });
}
