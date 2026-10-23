'use server';

import { headers } from 'next/headers';
import { verifyAdmin } from '@/lib/auth-checks';
import { assertR2UploadOrigin } from '@/lib/r2-upload-origin';
import { createDocsUpload, verifyDocsUpload } from '@/lib/docs-r2';

export async function prepareDocsAttachment(name: string, type: string, size: number) {
  const { authorized } = await verifyAdmin();
  if (!authorized) return { error: 'Unauthorized.' };
  try { assertR2UploadOrigin((await headers()).get('origin') || ''); return await createDocsUpload(name, type, size); }
  catch (error) { return { error: error instanceof Error ? error.message : 'Could not prepare attachment upload.' }; }
}

export async function completeDocsAttachment(key: string, type: string, size: number) {
  const { authorized } = await verifyAdmin();
  if (!authorized) return { error: 'Unauthorized.' };
  try { await verifyDocsUpload(key, type, size); return { success: true as const }; }
  catch (error) { return { error: error instanceof Error ? error.message : 'Could not verify attachment.' }; }
}
