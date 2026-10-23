import { getPublicProfileRecord } from '@/lib/public-data';

/** Public feature flag shared by the guestbook page and its mutation endpoints. */
export async function isGuestbookEnabled() {
  try {
    const config = await getPublicProfileRecord();
    return config?.site?.guestbookEnabled !== false;
  } catch {
    // Keep the guestbook available if public configuration is temporarily unavailable.
    return true;
  }
}
