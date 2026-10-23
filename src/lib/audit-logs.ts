import { neon } from '@neondatabase/serverless';

export const auditSeverities = ['info', 'warning', 'error', 'security'] as const;
export const auditStatuses = ['success', 'failure', 'blocked'] as const;
export type AuditSeverity = (typeof auditSeverities)[number];
export type AuditStatus = (typeof auditStatuses)[number];

export type AuditLog = {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_role: string;
  event_type: string;
  action: string;
  category: string;
  severity: AuditSeverity;
  status: AuditStatus;
  message: string;
  metadata: Record<string, unknown>;
  request_id: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  created_at: string;
};

export type AuditLogFilters = {
  query?: string;
  category?: string;
  severity?: AuditSeverity | '';
  status?: AuditStatus | '';
  actorRole?: string;
  page?: number;
};

type AuditLogInput = Omit<Partial<AuditLog>, 'id' | 'created_at' | 'metadata'> & {
  event_type: string;
  action: string;
  message: string;
  metadata?: Record<string, unknown>;
};

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const unsafeMetadataKey = /(?:authorization|cookie|token|secret|password|email|ip|user.?agent)/i;

function database() {
  const url = process.env.NEON_LOGS_DATABASE_URL;
  return url ? neon(url) : null;
}

function cleanText(value: unknown, max: number) {
  return typeof value === 'string' ? value.replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max) : '';
}

function cleanMetadata(value: Record<string, unknown> | undefined) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const safe = Object.entries(value)
    .filter(([key]) => /^[a-zA-Z0-9_.-]{1,60}$/.test(key) && !unsafeMetadataKey.test(key))
    .slice(0, 20)
    .reduce<Record<string, string | number | boolean | null>>((result, [key, item]) => {
      if (typeof item === 'string') result[key] = cleanText(item, 300);
      else if (typeof item === 'number' && Number.isFinite(item)) result[key] = item;
      else if (typeof item === 'boolean' || item === null) result[key] = item;
      return result;
    }, {});
  return safe;
}

function enumValue<T extends readonly string[]>(value: unknown, choices: T, fallback: T[number]) {
  return typeof value === 'string' && (choices as readonly string[]).includes(value) ? value as T[number] : fallback;
}

export function auditLoggingConfigured() {
  return Boolean(process.env.NEON_LOGS_DATABASE_URL);
}

// Logging must never interrupt the user-facing request. Every field is allow-listed
// and metadata is deliberately stripped of credentials, cookies, email and IP data.
export async function writeAuditLog(input: AuditLogInput) {
  const sql = database();
  if (!sql) return false;
  try {
    const eventType = cleanText(input.event_type, 80);
    const action = cleanText(input.action, 80);
    const message = cleanText(input.message, 500);
    if (!eventType || !action || !message) return false;
    await sql`
      INSERT INTO audit_logs (actor_id, actor_name, actor_role, event_type, action, category, severity, status, message, metadata, request_id, ip_hash, user_agent)
      VALUES (
        ${cleanText(input.actor_id, 160) || null},
        ${cleanText(input.actor_name, 100) || null},
        ${cleanText(input.actor_role, 40) || 'system'},
        ${eventType}, ${action}, ${cleanText(input.category, 80) || 'application'},
        ${enumValue(input.severity, auditSeverities, 'info')},
        ${enumValue(input.status, auditStatuses, 'success')},
        ${message}, ${JSON.stringify(cleanMetadata(input.metadata))}::jsonb,
        ${cleanText(input.request_id, 120) || null}, null, null
      )
    `;
    return true;
  } catch {
    return false;
  }
}

export async function listAuditLogs(filters: AuditLogFilters = {}) {
  const sql = database();
  if (!sql) return { logs: [] as AuditLog[], total: 0, configured: false };
  const query = cleanText(filters.query, 100) || null;
  const category = cleanText(filters.category, 80) || null;
  const role = cleanText(filters.actorRole, 40) || null;
  const severity = typeof filters.severity === 'string' && auditSeverities.includes(filters.severity as AuditSeverity) ? filters.severity : null;
  const status = typeof filters.status === 'string' && auditStatuses.includes(filters.status as AuditStatus) ? filters.status : null;
  const page = Math.max(1, Math.min(10_000, Math.floor(filters.page || 1)));
  const limit = 50;
  const offset = (page - 1) * limit;
  const phrase = query ? `%${query.replace(/[\\%_]/g, '\\$&')}%` : null;
  try {
    const [logs, count] = await Promise.all([
      sql`SELECT id, actor_id, actor_name, actor_role, event_type, action, category, severity, status, message, metadata, request_id, ip_hash, user_agent, created_at FROM audit_logs WHERE (${category}::text IS NULL OR category = ${category}) AND (${severity}::text IS NULL OR severity = ${severity}) AND (${status}::text IS NULL OR status = ${status}) AND (${role}::text IS NULL OR actor_role = ${role}) AND (${phrase}::text IS NULL OR message ILIKE ${phrase} ESCAPE '\\' OR action ILIKE ${phrase} ESCAPE '\\' OR COALESCE(actor_name, '') ILIKE ${phrase} ESCAPE '\\') ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}` as unknown as Promise<AuditLog[]>,
      sql`SELECT COUNT(*)::text AS total FROM audit_logs WHERE (${category}::text IS NULL OR category = ${category}) AND (${severity}::text IS NULL OR severity = ${severity}) AND (${status}::text IS NULL OR status = ${status}) AND (${role}::text IS NULL OR actor_role = ${role}) AND (${phrase}::text IS NULL OR message ILIKE ${phrase} ESCAPE '\\' OR action ILIKE ${phrase} ESCAPE '\\' OR COALESCE(actor_name, '') ILIKE ${phrase} ESCAPE '\\')` as unknown as Promise<Array<{ total: string }>>,
    ]);
    return { logs: logs.map(log => ({ ...log, metadata: log.metadata && typeof log.metadata === 'object' ? log.metadata : {} })), total: Number(count[0]?.total || 0), configured: true };
  } catch {
    return { logs: [] as AuditLog[], total: 0, configured: true, error: 'Could not read audit logs.' };
  }
}

export async function deleteAuditLog(id: string) {
  const sql = database();
  if (!sql || !ID.test(id)) return false;
  try { await sql`DELETE FROM audit_logs WHERE id = ${id}`; return true; }
  catch { return false; }
}

export async function clearAuditLogs() {
  const sql = database();
  if (!sql) return false;
  try { await sql`DELETE FROM audit_logs`; return true; }
  catch { return false; }
}
