import { getAuthUser } from '@/lib/openauth';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { getDiscordAccess } from '@/lib/discord-access';

const hasCurrentAdminAccess = cache(async (id: string) => {
  return getDiscordAccess(id);
});

export async function verifyAdmin() {
  let user;
  try { user = await getAuthUser(); }
  catch { return { authorized: false, error: 'discord_unavailable' } as const; }
  if (!user) return { authorized: false, error: 'not_logged_in' } as const;
  if (user.provider !== 'discord') return { authorized: false, error: 'discord_required' } as const;
  // A role granted after login must not be rejected by an old JWT snapshot.
  const access = await hasCurrentAdminAccess(user.id);
  if (access.status === 'unavailable') return { authorized: false, error: access.reason === 'configuration' ? 'auth_configuration' : 'discord_unavailable' } as const;
  if (access.status === 'denied') return { authorized: false, error: access.reason === 'not_member' ? 'discord_not_member' : 'unauthorized_role' } as const;
  return { authorized: true, user } as const;
}

export async function protectAdminPage() {
  const result = await verifyAdmin();
  if (!result.authorized) redirect(`/auth/login?source=admin&error=${result.error}`);
  return result.user;
}
