'use server';

import { verifyAdmin } from '@/lib/auth-checks';
import { createShortLink, deleteShortLink, listShortLinks, type ShortLinkInput, updateShortLink } from '@/lib/shortio';

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
  try { return { links: await listShortLinks() } as const; } catch (error) { return { error: error instanceof Error ? error.message : 'Could not load Short.io links.' } as const; }
}

export async function createShortLinkAction(input: ShortLinkInput) {
  if (!(await verifyAdmin()).authorized) return { error: 'Unauthorized.' } as const;
  try { return { link: await createShortLink(validate(input)) } as const; } catch (error) { return { error: error instanceof Error ? error.message : 'Could not create link.' } as const; }
}

export async function updateShortLinkAction(id: string, input: ShortLinkInput) {
  if (!(await verifyAdmin()).authorized) return { error: 'Unauthorized.' } as const;
  if (!/^lnk_[A-Za-z0-9_-]+(?:_[A-Za-z0-9_-]+)?$/.test(id)) return { error: 'Invalid Short.io link ID.' } as const;
  try { return { link: await updateShortLink(id, validate(input)) } as const; } catch (error) { return { error: error instanceof Error ? error.message : 'Could not update link.' } as const; }
}

export async function deleteShortLinkAction(id: string) {
  if (!(await verifyAdmin()).authorized) return { error: 'Unauthorized.' } as const;
  if (!/^lnk_[A-Za-z0-9_-]+(?:_[A-Za-z0-9_-]+)?$/.test(id)) return { error: 'Invalid Short.io link ID.' } as const;
  try { await deleteShortLink(id); return { success: true } as const; } catch (error) { return { error: error instanceof Error ? error.message : 'Could not delete link.' } as const; }
}
