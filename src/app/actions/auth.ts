'use server';

import { redirect } from 'next/navigation';
import { clearAuthTokens } from '@/lib/openauth';
import { safeReturnPath } from '@/lib/auth-redirect';

export async function logout(redirectTo: string = '/') {
  await clearAuthTokens();
  redirect(safeReturnPath(redirectTo));
}
