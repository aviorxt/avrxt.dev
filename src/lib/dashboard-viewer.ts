import { getAuthUser } from '@/lib/discord-auth';

export type DashboardViewer = {
  username: string;
  displayName: string;
  avatarUrl?: string;
};

export async function getDashboardViewer(): Promise<DashboardViewer> {
  const user = await getAuthUser();
  const username = user?.user_metadata.user_name || user?.user_metadata.full_name || 'discord-admin';
  return {
    username,
    displayName: user?.user_metadata.full_name || username,
    avatarUrl: user?.user_metadata.avatar_url,
  };
}
