import { getAuthUser } from '@/lib/openauth';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { checkDiscordRole } from '@/lib/discord';

const hasCurrentAdminAccess = cache(async (id: string) => {
  const owner = process.env.DISCORD_ADMIN_USER_ID?.trim();
  return Boolean(owner && id === owner) || await checkDiscordRole(id);
});

export async function verifyAdmin() {
  const user = await getAuthUser();
  if (!user) return { authorized: false, error: 'not_logged_in' } as const;
  if (!user.admin || user.provider !== 'discord') return { authorized: false, error: 'unauthorized_role' } as const;
  if (!await hasCurrentAdminAccess(user.id)) return { authorized: false, error: 'unauthorized_role' } as const;
  return { authorized: true, user } as const;
}

export async function protectAdminPage() {
  const result = await verifyAdmin();
  if (!result.authorized) redirect(`/auth/login?source=admin&error=${result.error}`);
  return result.user;
}
