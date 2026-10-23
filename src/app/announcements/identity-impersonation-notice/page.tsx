import { IdentityImpersonationNotice } from '@/app/announcement/page';
import { buildPageMetadata } from '@/lib/page-metadata';

export const metadata = buildPageMetadata({
  title: 'Identity impersonation notice',
  description: 'Detailed AVRXT security report covering fake domains, unofficial email addresses, trusted links, and reporting guidance.',
  keywords: ['avrxt impersonation notice', 'avrxt fake domain', 'avrxt fake email', 'avrxt phishing report'],
  path: '/announcements/identity-impersonation-notice',
});

export default function IdentityImpersonationNoticePage() {
  return <IdentityImpersonationNotice />;
}
