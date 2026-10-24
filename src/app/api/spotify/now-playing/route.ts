import { NextResponse } from 'next/server';
import { getNowPlaying, getSpotifyTokens } from '@/lib/spotify';
import { createAdminClient } from '@/utils/supabase/admin';
import { cachedPublic } from '@/lib/public-cache';
import { isProfileEnabled } from '@/lib/public-feature-config';

export const dynamic = 'force-dynamic';
const cacheHeaders = { 'Cache-Control': 'no-store, max-age=0' };
function json(value: unknown) { return NextResponse.json(value, { headers: cacheHeaders }); }

type SpotifyState = {
    isPlaying: boolean;
    connected: boolean;
    title?: string;
    artist?: string;
    album?: string;
    albumImageUrl?: string;
    songUrl?: string;
    progressMs?: number;
    durationMs?: number;
    playedAt?: string;
    fetchedAt: number;
};

async function publishSpotifyState(value: SpotifyState) {
    const supabase = createAdminClient();
    const { error } = await supabase.from('spotify_status').upsert({
        id: 1,
        is_playing: value.isPlaying,
        title: value.title ?? null,
        artist: value.artist ?? null,
        album: value.album ?? null,
        album_image_url: value.albumImageUrl ?? null,
        song_url: value.songUrl ?? null,
        progress_ms: value.progressMs ?? null,
        duration_ms: value.durationMs ?? null,
        updated_at: new Date().toISOString(),
    });

    if (error) console.error('[SPOTIFY_STATUS_PUBLISH_FAILED]', error.code);
}

async function loadNowPlaying(): Promise<SpotifyState> {
    const tokens = await getSpotifyTokens();
    if (!tokens) {
        return { isPlaying: false, connected: false, fetchedAt: Date.now() };
    }

    const nowPlaying = await getNowPlaying();

    if (nowPlaying.isPlaying) {
        const value = { ...nowPlaying, connected: true, fetchedAt: Date.now() };
        await publishSpotifyState(value);
        return value;
    }

    // If not playing, get last played from history
    const supabase = createAdminClient();
    const { data: lastPlayed, error } = await supabase
        .from('spotify_history')
        .select('*')
        .order('played_at', { ascending: false })
        .limit(1)
        .single();

    const value: SpotifyState = error || !lastPlayed
        ? { isPlaying: false, connected: true, fetchedAt: Date.now() }
        : {
            isPlaying: false,
            title: lastPlayed.song_name,
            artist: lastPlayed.artist,
            albumImageUrl: lastPlayed.cover_url,
            playedAt: lastPlayed.played_at,
            connected: true,
            fetchedAt: Date.now(),
        };
    await publishSpotifyState(value);
    return value;
}

export async function GET() {
    if (!await isProfileEnabled()) return NextResponse.json({ error: 'PROFILE_DISABLED' }, { status: 404 });
    try {
        // Keep one shared, short-lived source poll and publish changes through
        // Supabase Realtime to all open profile tabs over WebSocket.
        const value = await cachedPublic('spotify:now-playing', { ttlSeconds: 5, tags: ['spotify'] }, loadNowPlaying);
        return json(value);
    } catch (error) {
        console.error('Error in now-playing API:', error);
        return NextResponse.json({ isPlaying: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
