import { NextResponse } from 'next/server';
import { getMuzixChart } from '@/lib/spotify-chart';
import { cachedPublic } from '@/lib/public-cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const chart = await cachedPublic('spotify:chart', { ttlSeconds: 60, tags: ['spotify'], cacheable: value => value.connected === true }, getMuzixChart);
    return NextResponse.json(chart, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    console.error('[SPOTIFY_CHART_FAILED]', error);
    return NextResponse.json(
      { connected: false, error: 'Music data is temporarily unavailable.' },
      { status: 503 },
    );
  }
}
