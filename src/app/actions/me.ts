'use server';

import { getPublicProfileRecord } from '@/lib/public-data';
import { invalidatePublicCache } from '@/lib/public-cache';
import { revalidatePath } from 'next/cache';
import { MeConfig, defaultMeConfig } from '@/lib/me-config';
import { isMeFontId } from '@/lib/me-fonts';
import { isMeThemeId } from '@/lib/me-themes';
import { verifyAdmin } from '@/lib/auth-checks';
import { createAdminClient } from '@/utils/supabase/admin';
import { getAdminDashboardPath } from '@/lib/admin-dashboard';

function safeUrl(value: unknown, media = false): string {
    if (typeof value !== 'string') return '';
    const candidate = value.trim();
    if (!candidate || candidate.length > 2048 || /[\u0000-\u001f\\]/.test(candidate)) return '';

    try {
        const parsed = new URL(candidate, 'https://www.avrxt.dev');
        const isInternal = parsed.origin === 'https://www.avrxt.dev';
        if (!media && isInternal && /^\/(?:gallery|galleery|portfolio)(?:\/|$)/i.test(parsed.pathname)) return '';
        if (isInternal && candidate.startsWith('/') && !candidate.startsWith('//')) {
            return `${parsed.pathname}${parsed.search}${parsed.hash}`;
        }
        if (parsed.username || parsed.password) return '';
        const allowedProtocols = media ? ['https:'] : ['https:', 'http:', 'mailto:', 'tel:'];
        return allowedProtocols.includes(parsed.protocol) ? parsed.toString() : '';
    } catch {
        return '';
    }
}

function normalizeMeConfig(config: MeConfig): MeConfig {
    if (!config || typeof config !== 'object' || !config.profile || !config.music) throw new Error('Invalid profile configuration.');
    const normalized: MeConfig = {
        ...config,
        site: {
            maintenanceEnabled: config.site?.maintenanceEnabled === true,
            guestbookEnabled: config.site?.guestbookEnabled !== false,
            profileEnabled: config.site?.profileEnabled !== false,
            newsletterEnabled: config.site?.newsletterEnabled !== false,
            newsletterShowHome: config.site?.newsletterShowHome !== false,
            newsletterShowProfile: config.site?.newsletterShowProfile !== false,
            contactEnabled: config.site?.contactEnabled !== false,
            statusPageEnabled: config.site?.statusPageEnabled !== false,
            statusBadgeEnabled: config.site?.statusBadgeEnabled !== false,
        },
        profile: { ...config.profile },
        music: { ...config.music },
        links: Array.isArray(config.links) ? config.links : [],
        gallery: Array.isArray(config.gallery) ? config.gallery : [],
        resources: Array.isArray(config.resources) ? config.resources : [],
        widgets: config.widgets ? { ...config.widgets } : config.widgets,
    };

    normalized.music.audioUrl = typeof normalized.music.audioUrl === 'string' ? normalized.music.audioUrl.trim() : '';
    normalized.music.youtubeVideoId = typeof normalized.music.youtubeVideoId === 'string' ? normalized.music.youtubeVideoId.trim() : '';
    const coordinates = normalized.profile.weatherCoordinates;
    if (coordinates && (!Number.isFinite(coordinates.latitude) || !Number.isFinite(coordinates.longitude) || Math.abs(coordinates.latitude) > 90 || Math.abs(coordinates.longitude) > 180)) {
        delete normalized.profile.weatherCoordinates;
    }
    normalized.profile.avatarUrl = safeUrl(normalized.profile.avatarUrl, true) || defaultMeConfig.profile.avatarUrl;
    normalized.profile.fontTheme = isMeFontId(normalized.profile.fontTheme) ? normalized.profile.fontTheme : 'outfit';
    normalized.profile.visualTheme = isMeThemeId(normalized.profile.visualTheme) ? normalized.profile.visualTheme : 'primary';
    normalized.profile.themeColor = '#ffffff';
    normalized.profile.logoUrl = safeUrl(normalized.profile.logoUrl, true);
    normalized.profile.bannerUrl = safeUrl(normalized.profile.bannerUrl, true);
    normalized.music.coverUrl = safeUrl(normalized.music.coverUrl, true);
    normalized.music.audioUrl = safeUrl(normalized.music.audioUrl, true);
    normalized.music.youtubeVideoId = /^[\w-]{11}$/.test(normalized.music.youtubeVideoId) ? normalized.music.youtubeVideoId : '';
    if (normalized.profile.presence?.discordId) {
        normalized.profile.presence.discordId = /^\d{17,20}$/.test(normalized.profile.presence.discordId)
            ? normalized.profile.presence.discordId
            : '';
    }
    normalized.links = normalized.links
        .filter((link) => link && typeof link.name === 'string' && typeof link.url === 'string')
        .map((link) => {
            if (link.icon === 'Instagram' || link.name.toLowerCase() === 'instagram') {
                return { ...link, name: 'Instagram', url: 'https://www.instagram.com/aviorxt/' };
            }
            if (link.icon === 'Github' || link.name.toLowerCase() === 'github') {
                return { ...link, name: 'GitHub', url: 'https://github.com/aviorxt' };
            }
            return { ...link, url: safeUrl(link.url) };
        })
        .filter((link) => Boolean(link.url));

    if (!normalized.links.some((link) => link.icon === 'Instagram' || link.name.toLowerCase() === 'instagram')) {
        normalized.links.unshift({ id: 'instagram-aviorxt', name: 'Instagram', url: 'https://www.instagram.com/aviorxt/', icon: 'Instagram', type: 'social' });
    }
    normalized.gallery = normalized.gallery
        .filter((item) => item && typeof item.url === 'string')
        .map((item) => ({ ...item, url: safeUrl(item.url, true) }))
        .filter((item) => Boolean(item.url));
    normalized.resources = normalized.resources
        .filter((item) => item && typeof item.url === 'string')
        .map((item) => ({ ...item, url: safeUrl(item.url), previewUrl: safeUrl(item.previewUrl, true) }))
        .filter((item) => Boolean(item.url));

    // Prefer YouTube when a videoId is set (avoids stale audioUrl breaking playback)
    if (normalized.music.youtubeVideoId) {
        normalized.music.audioUrl = '';
    }

    return normalized;
}

export async function getMeConfigAction(): Promise<MeConfig> {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('Supabase is not configured, returning default me_config.');
        return defaultMeConfig;
    }

    try {
        const config = await getPublicProfileRecord();
        return config ? normalizeMeConfig(config) : defaultMeConfig;
    } catch (error) {
        console.warn('Unable to fetch me_config, returning default:', error);
        return defaultMeConfig;
    }
}

export async function saveMeConfigAction(config: MeConfig) {
    const { authorized, error: authError } = await verifyAdmin();
    if (!authorized) {
        return { error: `Unauthorized: ${authError}` };
    }

    const supabase = createAdminClient();

    const { error } = await supabase
        .from('me_config')
        .upsert({
            key: 'main_config',
            data: normalizeMeConfig(config),
            updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

    if (error) {
        return { error: error.message };
    }

    const cacheInvalidated = await invalidatePublicCache('profile');
    revalidatePath('/');
    revalidatePath('/me');
    revalidatePath('/contact');
    revalidatePath('/subscribe');
    revalidatePath(await getAdminDashboardPath());
    revalidatePath('/maintenance');
    revalidatePath('/status');
    revalidatePath('/api/status');
    revalidatePath('/api/status/details');
    return { success: true, ...(!cacheInvalidated ? { warning: 'Saved, but Redis cache invalidation failed. Public data may take up to two minutes to refresh.' } : {}) };
}
