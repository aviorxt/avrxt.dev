import { HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getR2Client } from '@/lib/r2';

const TYPES: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif',
  'application/pdf': 'pdf', 'text/plain': 'txt', 'text/markdown': 'md', 'application/zip': 'zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
};

function bucket() { const value = process.env.R2_BUCKET_NAME?.trim(); if (!value) throw new Error('R2 bucket is not configured.'); return value; }
function details(name: string, type: string, size: number) {
  const extension = TYPES[type];
  if (!name || !extension || !Number.isSafeInteger(size) || size < 1 || size > 25 * 1024 ** 2) throw new Error('Supported attachments are images, PDF, text, Markdown, DOCX, XLSX, and ZIP up to 25 MB.');
  const key = `docs/avrxt-doc-${crypto.randomUUID()}.${extension}`;
  return { key, type, size, publicUrl: `https://cdn.avrxt.dev/${key}` };
}

function attachmentDisposition(key: string) {
  const name = key.split('/').at(-1) || 'attachment';
  return `attachment; filename="${name.replace(/[^A-Za-z0-9._-]/g, '_')}"`;
}

export async function createDocsUpload(name: string, type: string, size: number) {
  const file = details(name, type, size);
  const contentDisposition = attachmentDisposition(file.key);
  const uploadUrl = await getSignedUrl(getR2Client(), new PutObjectCommand({
    Bucket: bucket(), Key: file.key, ContentType: file.type,
    // Attachments never execute in the CDN origin, even if a browser attempts
    // MIME sniffing or the uploaded bytes do not match the claimed file type.
    ContentDisposition: contentDisposition,
  }), { expiresIn: 600, signableHeaders: new Set(['content-type', 'content-disposition']) });
  return { ...file, contentDisposition, uploadUrl };
}

export async function verifyDocsUpload(key: string, type: string, size: number) {
  if (!/^docs\/avrxt-doc-[a-f0-9-]{36}\.[a-z0-9]+$/.test(key) || !TYPES[type]) throw new Error('Invalid document attachment.');
  const object = await getR2Client().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
  if (object.ContentLength !== size || object.ContentType !== type || object.ContentDisposition !== attachmentDisposition(key)) throw new Error('Uploaded attachment did not pass verification.');
}
