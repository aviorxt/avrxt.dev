import { NextResponse } from 'next/server';
import { getMuzixChart } from '@/lib/spotify-chart';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const chart = await getMuzixChart();
    return NextResponse.json(chart, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' },
    });
  } catch (error) {
    console.error('[SPOTIFY_CHART_FAILED]', error);
    return NextResponse.json(
      { connected: false, error: 'Music data is temporarily unavailable.' },
      { status: 503 },
    );
  }
}
