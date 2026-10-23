import { isGuestbookEnabled as isEnabled } from '@/lib/public-feature-config';

/** Public feature flag shared by the guestbook page and its mutation endpoints. */
export async function isGuestbookEnabled() {
  return isEnabled();
}
