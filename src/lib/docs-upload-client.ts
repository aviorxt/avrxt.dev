'use client';

import { completeDocsAttachment, prepareDocsAttachment } from '@/app/actions/docs-assets';

export async function uploadDocsAttachment(file: File) {
  const prepared = await prepareDocsAttachment(file.name, file.type, file.size);
  if ('error' in prepared) throw new Error(prepared.error);
  const response = await fetch(prepared.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': prepared.type, 'Content-Disposition': prepared.contentDisposition },
    body: file,
  });
  if (!response.ok) throw new Error(`Upload rejected (${response.status}).`);
  const verified = await completeDocsAttachment(prepared.key, prepared.type, file.size);
  if ('error' in verified) throw new Error(verified.error);
  return prepared.publicUrl;
}
