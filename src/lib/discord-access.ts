export type DiscordAccess =
    | { status: 'allowed' }
    | { status: 'denied'; reason: 'role_missing' | 'not_member' }
    | { status: 'unavailable'; reason: 'configuration' | 'provider'; httpStatus?: number };
type Configuration = { guildId?: string; roleId?: string; botToken?: string; ownerId?: string; providerToken?: string };

// A failed Discord request is not evidence that a member lacks a role.
// Authorizations are never cached between requests: revocation takes effect live.
export async function lookupDiscordAccess(userId: string, config: Configuration, request: typeof fetch = fetch): Promise<DiscordAccess> {
    if (!/^\d{17,20}$/.test(userId)) return { status: 'unavailable', reason: 'configuration' };
    const owner = config.ownerId?.trim();
    if (owner && userId === owner) return { status: 'allowed' };
    const guild = config.guildId?.trim(); const role = config.roleId?.trim();
    if (!guild || !role || !/^\d{17,20}$/.test(guild) || !/^\d{17,20}$/.test(role)) return { status: 'unavailable', reason: 'configuration' };
    const candidates = [
        ...(config.providerToken ? [{ url: `https://discord.com/api/v10/users/@me/guilds/${guild}/member`, authorization: `Bearer ${config.providerToken}` }] : []),
        ...(config.botToken?.trim() ? [{ url: `https://discord.com/api/v10/guilds/${guild}/members/${userId}`, authorization: `Bot ${config.botToken.trim()}` }] : []),
    ];
    if (!candidates.length) return { status: 'unavailable', reason: 'configuration' };
    const signal = AbortSignal.timeout(4000);
    let httpStatus: number | undefined;
    for (const candidate of candidates) {
        try {
            const response = await request(candidate.url, { headers: { Authorization: candidate.authorization }, cache: 'no-store', signal });
            httpStatus = response.status;
            if (response.status === 404) return { status: 'denied', reason: 'not_member' };
            if (!response.ok) continue;
            const member = await response.json() as { roles?: unknown; user?: { id?: string } };
            if (!Array.isArray(member.roles) || !member.roles.every(role => typeof role === 'string') || (member.user?.id && member.user.id !== userId)) continue;
            return member.roles.includes(role) ? { status: 'allowed' } : { status: 'denied', reason: 'role_missing' };
        } catch { if (signal.aborted) break; }
    }
    return { status: 'unavailable', reason: 'provider', httpStatus };
}

export function getDiscordAccess(userId: string, providerToken?: string) {
    return lookupDiscordAccess(userId, { guildId: process.env.DISCORD_GUILD_ID, roleId: process.env.DISCORD_ROLE_ID,
        botToken: process.env.DISCORD_TOKEN, ownerId: process.env.DISCORD_ADMIN_USER_ID, providerToken });
}
