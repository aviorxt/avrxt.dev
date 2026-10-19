'use server';

import { redirect } from 'next/navigation';
import { clearAuthSession } from '@/lib/discord-auth';
import { safeReturnPath } from '@/lib/auth-redirect';

export async function logout(redirectTo: string = '/') {
  await clearAuthSession();
  redirect(safeReturnPath(redirectTo));
}
