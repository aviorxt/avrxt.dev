import { getDiscordAccess } from './discord-access';

export async function checkDiscordRole(userId: string, providerToken?: string) {
    return (await getDiscordAccess(userId, providerToken)).status === 'allowed';
}
