import 'server-only';
import { cachedPublic } from '@/lib/public-cache';
import { loadPublicStatus } from '@/lib/status-fetch';

export function getPublicStatusSnapshot() {
  return cachedPublic('status-dashboard-v1', { ttlSeconds: 30, cacheable: value => value.available }, () => loadPublicStatus());
}
