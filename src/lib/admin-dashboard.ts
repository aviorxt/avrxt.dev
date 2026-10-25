import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { verifyAuthSession } from '@/lib/discord-auth';

const SESSION_COOKIE = 'avrxt_session';
const DASHBOARD_ID_PATTERN = /^[A-Za-z0-9_-]{43}$/;

function dashboardId(session: string) {
  // This is deliberately derived from the signed, HTTP-only session cookie.
  // It is an opaque route identifier, not an authorization credential.
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret) return null;
  return createHmac('sha256', secret).update(`admin-dashboard:${session}`).digest('base64url');
}

async function currentDashboardId() {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!session || !verifyAuthSession(session)) return null;
  return dashboardId(session);
}

export async function getAdminDashboardPath() {
  const id = await currentDashboardId();
  return id ? `/dashboard/${id}/profile/admin` : '/dashboard';
}

export async function matchesAdminDashboardId(candidate: string) {
  if (!DASHBOARD_ID_PATTERN.test(candidate)) return false;
  const expected = await currentDashboardId();
  if (!expected || candidate.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(candidate), Buffer.from(expected));
}
