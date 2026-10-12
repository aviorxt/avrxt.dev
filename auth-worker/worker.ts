import { issuer } from '@openauthjs/openauth';
import { DiscordProvider } from '@openauthjs/openauth/provider/discord';
import { GithubProvider } from '@openauthjs/openauth/provider/github';
import { CloudflareStorage } from '@openauthjs/openauth/storage/cloudflare';
import { authSubjects } from './subjects';
import { lookupDiscordAccess } from '../src/lib/discord-access';
import type { ExecutionContext, KVNamespace } from '@cloudflare/workers-types';

interface Env {
  OPENAUTH_STORAGE: KVNamespace;
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  DISCORD_TOKEN: string;
  DISCORD_GUILD_ID: string;
  DISCORD_ROLE_ID: string;
  DISCORD_ADMIN_USER_ID?: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

function createIssuer(env: Env) {
  return issuer({
    subjects: authSubjects,
    ttl: { access: 900, refresh: 60 * 60 * 24 * 30 },
    storage: CloudflareStorage({ namespace: env.OPENAUTH_STORAGE }),
    allow: async ({ clientID, redirectURI }) => {
      if (clientID !== 'avrxt-web') return false;
      const url = new URL(redirectURI);
      const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
      return url.pathname === '/auth/callback' && !url.username && !url.password &&
        ((local && url.protocol === 'http:') || (url.protocol === 'https:' && !url.port &&
          (url.hostname === 'avrxt.dev' || url.hostname === 'www.avrxt.dev')));
    },
    providers: {
      discord: DiscordProvider({
        clientID: env.DISCORD_CLIENT_ID,
        clientSecret: env.DISCORD_CLIENT_SECRET,
        scopes: ['identify', 'email'],
      }),
      github: GithubProvider({
        clientID: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        scopes: ['read:user', 'user:email'],
      }),
    },
    async success(ctx, value) {
      if (value.provider === 'discord') {
        const profileResponse = await fetch('https://discord.com/api/v10/users/@me', {
          headers: { Authorization: `Bearer ${value.tokenset.access}` },
          signal: AbortSignal.timeout(5000),
        });
        if (!profileResponse.ok) throw new Error('Discord profile lookup failed');
        const profile = await profileResponse.json() as { id: string; email?: string; username?: string; avatar?: string };

        const access = await lookupDiscordAccess(profile.id, {
          guildId: env.DISCORD_GUILD_ID, roleId: env.DISCORD_ROLE_ID,
          botToken: env.DISCORD_TOKEN, ownerId: env.DISCORD_ADMIN_USER_ID,
        });
        const admin = access.status === 'allowed';

        if (!admin) {
          console.warn('[OPENAUTH_DISCORD_ACCESS_DENIED]', {
            userId: profile.id,
            status: access.status,
            reason: access.reason,
            httpStatus: access.status === 'unavailable' ? access.httpStatus : undefined,
          });
        }

        return ctx.subject('user', {
          id: profile.id,
          provider: 'discord',
          email: profile.email,
          name: profile.username,
          avatar: profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : undefined,
          admin,
        });
      }

      if (value.provider === 'github') {
        const profileResponse = await fetch('https://api.github.com/user', {
          headers: {
            Authorization: `Bearer ${value.tokenset.access}`,
            Accept: 'application/vnd.github+json',
            'User-Agent': 'avrxt.dev',
          },
        });
        if (!profileResponse.ok) throw new Error('GitHub profile lookup failed');
        const profile = await profileResponse.json() as { id: number; login: string; name?: string; email?: string; avatar_url?: string };
        return ctx.subject('user', {
          id: String(profile.id),
          provider: 'github',
          email: profile.email,
          name: profile.name || profile.login,
          avatar: profile.avatar_url,
          admin: false,
        });
      }

      throw new Error('Unsupported provider');
    },
  });
}

let openAuthApp: ReturnType<typeof createIssuer> | undefined;

const worker = {
  fetch(request: Request, env: Env, executionCtx: ExecutionContext) {
    openAuthApp ??= createIssuer(env);
    return openAuthApp.fetch(request, env, executionCtx);
  },
};

export default worker;
