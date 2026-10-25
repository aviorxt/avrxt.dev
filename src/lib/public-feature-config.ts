import { getPublicProfileRecord } from '@/lib/public-data';

async function enabled(key: 'profileEnabled' | 'guestbookEnabled' | 'newsletterEnabled' | 'contactEnabled' | 'statusPageEnabled' | 'statusBadgeEnabled') {
  try {
    const config = await getPublicProfileRecord();
    return config?.site?.[key] !== false;
  } catch {
    return true;
  }
}

export const isProfileEnabled = () => enabled('profileEnabled');
export const isGuestbookEnabled = () => enabled('guestbookEnabled');
export const isNewsletterEnabled = () => enabled('newsletterEnabled');
export const isContactEnabled = () => enabled('contactEnabled');
export const isStatusPageEnabled = () => enabled('statusPageEnabled');
export const isStatusBadgeEnabled = () => enabled('statusBadgeEnabled');
