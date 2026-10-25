'use server';

import { getAuthUser } from '@/lib/discord-auth';
import { verifyAdmin } from '@/lib/auth-checks';
import { clearAuditLogs, deleteAuditLog, listAuditLogs, writeAuditLog, type AuditLogFilters } from '@/lib/audit-logs';

function actor(user: NonNullable<Awaited<ReturnType<typeof getAuthUser>>>) {
  return { actor_id: user.id, actor_name: user.user_metadata.full_name || user.user_metadata.user_name || 'Discord admin', actor_role: 'admin' };
}

export async function listAuditLogsAction(filters: AuditLogFilters = {}) {
  if (!(await verifyAdmin()).authorized) return { error: 'Unauthorized.' } as const;
  return listAuditLogs(filters);
}

export async function deleteAuditLogAction(id: string) {
  const access = await verifyAdmin();
  if (!access.authorized) return { error: 'Unauthorized.' } as const;
  if (!await deleteAuditLog(id)) return { error: 'Could not delete this log.' } as const;
  const user = await getAuthUser();
  if (user) await writeAuditLog({ ...actor(user), event_type: 'audit', action: 'delete', category: 'administration', severity: 'warning', status: 'success', message: 'An audit-log entry was deleted.' });
  return { success: true } as const;
}

export async function clearAuditLogsAction() {
  const access = await verifyAdmin();
  if (!access.authorized) return { error: 'Unauthorized.' } as const;
  const user = await getAuthUser();
  if (!await clearAuditLogs()) return { error: 'Could not clear audit logs.' } as const;
  if (user) await writeAuditLog({ ...actor(user), event_type: 'audit', action: 'clear', category: 'administration', severity: 'warning', status: 'success', message: 'Audit logs were cleared by an administrator.' });
  return { success: true } as const;
}
