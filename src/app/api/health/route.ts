import { getPublicStatusSnapshot } from '@/lib/status-source';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { resolveMx } from 'node:dns/promises';
import { createAdminClient } from '@/utils/supabase/admin';
import { getSpotifyRedirectUri } from '@/lib/spotify-oauth';
import { timingSafeEqual } from 'node:crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type CheckResult = {
  name: string;
  ok: boolean;
  details: string;
  latencyMs: number;
};

function nowMs() {
  return Date.now();
}

function required(value: string | undefined | null): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

async function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function skippedCheck(name: string, details: string): CheckResult {
  return {
    name,
    ok: true,
    details,
    latencyMs: 0,
  };
}

async function checkSupabase(name: string): Promise<CheckResult> {
  const start = nowMs();

  const hasUrl = required(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasKey = required(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!hasUrl || !hasKey) {
    return {
      name,
      ok: false,
      details: 'Supabase environment not configured',
      latencyMs: nowMs() - start,
    };
  }

  try {
    const supabase = createAdminClient();
    const queryResult = await withTimeout(
      supabase.from('spotify_tokens').select('id').limit(1),
      10000
    ) as { error: { message: string } | null };

    if (queryResult.error) {
      return {
        name,
        ok: false,
        details: `Supabase query failed: ${queryResult.error.message}`,
        latencyMs: nowMs() - start,
      };
    }

    return {
      name,
      ok: true,
      details: 'Supabase reachable',
      latencyMs: nowMs() - start,
    };
  } catch (error) {
    return {
      name,
      ok: false,
      details: `Supabase check failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      latencyMs: nowMs() - start,
    };
  }
}

async function checkResendAndDns(name: string): Promise<CheckResult> {
  const start = nowMs();
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!required(apiKey) || !required(audienceId)) {
    return {
      name,
      ok: false,
      details: 'Resend environment not configured',
      latencyMs: nowMs() - start,
    };
  }

  try {
    const resend = new Resend(apiKey);
    const [resendResult, mxResult] = await Promise.all([
      withTimeout(resend.contacts.list({ audienceId }), 10000),
      withTimeout(resolveMx('gmail.com'), 10000),
    ]);

    if (resendResult.error) {
      return {
        name,
        ok: false,
        details: `Resend check failed: ${resendResult.error.message}`,
        latencyMs: nowMs() - start,
      };
    }

    if (!mxResult || mxResult.length === 0) {
      return {
        name,
        ok: false,
        details: 'DNS MX resolution failed',
        latencyMs: nowMs() - start,
      };
    }

    return {
      name,
      ok: true,
      details: 'Resend and DNS reachable',
      latencyMs: nowMs() - start,
    };
  } catch (error) {
    return {
      name,
      ok: false,
      details: `Resend/DNS check failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      latencyMs: nowMs() - start,
    };
  }
}

async function checkSpotifyConfig(name: string): Promise<CheckResult> {
  const start = nowMs();
  const ok =
    required(process.env.SPOTIFY_CLIENT_ID) &&
    required(process.env.SPOTIFY_CLIENT_SECRET) &&
    getSpotifyRedirectUri('https://www.avrxt.dev').startsWith('https://');

  return {
    name,
    ok,
    details: ok ? 'Spotify OAuth env configured' : 'Spotify OAuth env missing',
    latencyMs: nowMs() - start,
  };
}

async function checkStatusProvider(name: string): Promise<CheckResult> {
  const start = nowMs();
  try {
    const snapshot = await getPublicStatusSnapshot();
    return { name, ok: snapshot.available, details: snapshot.available ? 'Public Better Stack feed reachable' : 'Public status feed unavailable', latencyMs: nowMs() - start };
  } catch { return { name, ok: false, details: 'Public status feed unavailable', latencyMs: nowMs() - start }; }
}

export async function GET(request: Request) {
  if (new URL(request.url).searchParams.get('deep') !== '1') {
    return NextResponse.json({ status: 'healthy', timestamp: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
  }
  const expected = process.env.HEALTH_CHECK_TOKEN || '';
  const supplied = request.headers.get('authorization')?.replace(/^Bearer /i, '') || '';
  if (!expected || Buffer.byteLength(expected) !== Buffer.byteLength(supplied) || !timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const started = nowMs();

  const checks = await Promise.all([
    Promise.resolve(skippedCheck('api/contact', 'Google Sheets/Gmail deep check skipped by policy')),
    checkSpotifyConfig('api/spotify/auth+callback'),
    checkSupabase('api/spotify/now-playing'),
    checkResendAndDns('api/subscribe'),
    checkStatusProvider('api/status'),
  ]);

  const failed = checks.filter((c) => !c.ok);
  const overallHealthy = failed.length === 0;
  const duration = nowMs() - started;

  return NextResponse.json(
    {
      status: overallHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      latencyMs: duration,
      summary: {
        total: checks.length,
        passing: checks.length - failed.length,
        failing: failed.length,
      },
      checks,
    },
    {
      status: overallHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
