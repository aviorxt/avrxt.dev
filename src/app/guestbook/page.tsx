import type { Metadata } from 'next';
import { createPublicClient } from '@/utils/supabase/public';
import { getGuestbookUser, guestbookAuthorId } from '@/lib/guestbook-auth';
import { isGuestbookEnabled } from '@/lib/guestbook-config';
import GuestbookClient, { type GuestbookEntry, type GuestbookViewer } from './GuestbookClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Guestbook | Leave Your FootPrint',
  description: 'Leave a signed message in the AVRXT guestbook.',
  alternates: { canonical: '/guestbook' },
};

export default async function GuestbookPage() {
  const enabled = await isGuestbookEnabled();
  if (!enabled) return <GuestbookClient initialEntries={[]} viewer={null} enabled={false} />;
  let entries: GuestbookEntry[] = [];
  try {
    const supabase = createPublicClient();
    const { data } = await supabase.from('guestbook_entries').select('id,author_id,provider,display_name,avatar_url,message,created_at,updated_at').order('created_at', { ascending: false }).limit(80);
    entries = (data || []) as GuestbookEntry[];
  } catch { /* The page remains usable before the migration/environment is configured. */ }

  const user = await getGuestbookUser();
  const viewer: GuestbookViewer | null = user ? {
    id: guestbookAuthorId(user),
    displayName: [user.user_metadata.full_name, user.user_metadata.user_name].find((value): value is string => typeof value === 'string' && value.length > 0) || 'Signed in visitor',
    avatarUrl: typeof user.user_metadata.avatar_url === 'string' && user.user_metadata.avatar_url.startsWith('https://') ? user.user_metadata.avatar_url : null,
    provider: user.provider,
  } : null;

  return <GuestbookClient initialEntries={entries} viewer={viewer} enabled={enabled} />;
}
