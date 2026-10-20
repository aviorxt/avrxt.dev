import { NextResponse } from 'next/server';
import { getNowPlaying, getSpotifyTokens } from '@/lib/spotify';
import { createAdminClient } from '@/utils/supabase/admin';
import { cachedPublic } from '@/lib/public-cache';

export const dynamic = 'force-dynamic';
const cacheHeaders = { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=90' };
function json(value: unknown) { return NextResponse.json(value, { headers: cacheHeaders }); }

async function loadNowPlaying() {
    const tokens = await getSpotifyTokens();
    if (!tokens) {
        return { isPlaying: false, connected: false, error: 'Spotify not connected' };
    }

    const nowPlaying = await getNowPlaying();

    if (nowPlaying.isPlaying) {
        return { ...nowPlaying, connected: true, fetchedAt: Date.now() };
    }

    // If not playing, get last played from history
    const supabase = createAdminClient();
    const { data: lastPlayed, error } = await supabase
        .from('spotify_history')
        .select('*')
        .order('played_at', { ascending: false })
        .limit(1)
        .single();

    if (error || !lastPlayed) {
        return { isPlaying: false, connected: true, fetchedAt: Date.now() };
    }

    return {
        isPlaying: false,
        title: lastPlayed.song_name,
        artist: lastPlayed.artist,
        albumImageUrl: lastPlayed.cover_url,
        playedAt: lastPlayed.played_at,
        connected: true,
        fetchedAt: Date.now(),
    };
}

export async function GET() {
    try {
        const value = await cachedPublic('spotify:now-playing', { ttlSeconds: 30, tags: ['spotify'] }, loadNowPlaying);
        return json(value);
    } catch (error) {
        console.error('Error in now-playing API:', error);
        return NextResponse.json({ isPlaying: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
