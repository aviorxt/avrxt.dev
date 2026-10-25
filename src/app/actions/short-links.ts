'use server';

import { verifyAdmin } from '@/lib/auth-checks';
import { createShortLink, deleteShortLink, listShortLinks, type ShortLinkInput, updateShortLink } from '@/lib/shortio';
import { getAuthUser } from '@/lib/discord-auth';
import { writeAuditLog } from '@/lib/audit-logs';

async function logAdminShortLink(action: 'create' | 'update' | 'delete', message: string) {
  const user = await getAuthUser();
  if (!user) return;
  await writeAuditLog({ actor_id: user.id, actor_name: user.user_metadata.full_name || user.user_metadata.user_name || 'Discord admin', actor_role: 'admin', event_type: 'short_link', action, category: 'administration', severity: action === 'delete' ? 'warning' : 'info', status: 'success', message });
}

function validate(input: ShortLinkInput) {
  const originalURL = typeof input?.originalURL === 'string' ? input.originalURL.trim() : '';
  try { const url = new URL(originalURL); if (!['http:', 'https:'].includes(url.protocol)) throw new Error(); } catch { throw new Error('Enter a valid http(s) destination URL.'); }
  const path = typeof input.path === 'string' ? input.path.trim().replace(/^\/+|\/+$/g, '') : '';
  if (path && !/^[A-Za-z0-9_-]{1,120}$/.test(path)) throw new Error('The short path may contain only letters, numbers, hyphens, and underscores.');
  const title = typeof input.title === 'string' ? input.title.trim().slice(0, 250) : '';
  const tags = Array.isArray(input.tags) ? input.tags.filter((tag): tag is string => typeof tag === 'string').map(tag => tag.trim()).filter(Boolean).slice(0, 20) : [];
  const redirectType = [301, 302, 307, 308].includes(input.redirectType || 302) ? input.redirectType : 302;
  const expiresAt = typeof input.expiresAt === 'string' && input.expiresAt ? new Date(input.expiresAt).toISOString() : undefined;
  return { originalURL, path, title, tags, redirectType, expiresAt, archived: input.archived === true } as ShortLinkInput;
}

export async function listShortLinksAction() {
  if (!(await verifyAdmin()).authorized) return { error: 'Unauthorized.' } as const;
  try { return { links: await listShortLinks() } as const; } catch { return { error: 'Could not load Short.io links.' } as const; }
}

export async function createShortLinkAction(input: ShortLinkInput) {
  if (!(await verifyAdmin()).authorized) return { error: 'Unauthorized.' } as const;
  try { const link = await createShortLink(validate(input)); await logAdminShortLink('create', 'An administrator created a Short.io link.'); return { link } as const; } catch (error) { return { error: error instanceof Error && error.message.startsWith('Enter a valid') || error instanceof Error && error.message.startsWith('The short path') ? error.message : 'Could not create link.' } as const; }
}

export async function updateShortLinkAction(id: string, input: ShortLinkInput) {
  if (!(await verifyAdmin()).authorized) return { error: 'Unauthorized.' } as const;
  if (!/^lnk_[A-Za-z0-9_-]+(?:_[A-Za-z0-9_-]+)?$/.test(id)) return { error: 'Invalid Short.io link ID.' } as const;
  try { const link = await updateShortLink(id, validate(input)); await logAdminShortLink('update', 'An administrator updated a Short.io link.'); return { link } as const; } catch (error) { return { error: error instanceof Error && (error.message.startsWith('Enter a valid') || error.message.startsWith('The short path')) ? error.message : 'Could not update link.' } as const; }
}

export async function deleteShortLinkAction(id: string) {
  if (!(await verifyAdmin()).authorized) return { error: 'Unauthorized.' } as const;
  if (!/^lnk_[A-Za-z0-9_-]+(?:_[A-Za-z0-9_-]+)?$/.test(id)) return { error: 'Invalid Short.io link ID.' } as const;
  try { await deleteShortLink(id); await logAdminShortLink('delete', 'An administrator deleted a Short.io link.'); return { success: true } as const; } catch { return { error: 'Could not delete link.' } as const; }
}
