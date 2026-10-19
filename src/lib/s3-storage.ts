import {
  CopyObjectCommand, DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand, HeadObjectCommand,
  ListObjectsV2Command, PutObjectCommand, S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export type StorageEntry = { key: string; name: string; type: 'file' | 'folder'; size?: number; updatedAt?: string; contentType?: string; visibility?: 'private' | 'public' };
const INTERNAL_PREFIX = '__avrxt-storage/';
const visibilityKey = (key: string) => `${INTERNAL_PREFIX}visibility/${Buffer.from(key).toString('base64url')}.json`;
const shareKey = (token: string) => `${INTERNAL_PREFIX}shares/${token}.json`;

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

function client() {
  return new S3Client({
    region: required('AWS_REGION'),
    endpoint: process.env.AWS_S3_ENDPOINT?.trim() || undefined,
    forcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE === 'true',
    credentials: { accessKeyId: required('AWS_ACCESS_KEY_ID'), secretAccessKey: required('AWS_SECRET_ACCESS_KEY') },
  });
}

function bucket() { return required('AWS_S3_BUCKET_NAME'); }

export function normalizeStorageKey(value: string, options: { folder?: boolean } = {}) {
  if (typeof value !== 'string') throw new Error('Invalid storage path.');
  const key = options.folder ? value.trim().replace(/\/+$/, '') : value.trim();
  if (!key || key.length > 1024 || key.startsWith('/') || key.includes('\\') || /[\u0000-\u001f]/.test(key)) throw new Error('Invalid storage path.');
  const parts = key.split('/');
  if (parts.some(part => !part || part === '.' || part === '..')) throw new Error('Invalid storage path.');
  return options.folder ? `${key}/` : key;
}

function fileName(key: string) { return key.split('/').filter(Boolean).at(-1) || key; }

export async function listStorage(prefix = ''): Promise<StorageEntry[]> {
  const safePrefix = prefix ? normalizeStorageKey(prefix, { folder: true }) : '';
  const result = await client().send(new ListObjectsV2Command({ Bucket: bucket(), Prefix: safePrefix, Delimiter: '/', MaxKeys: 200 }));
  const visibility = new Set<string>();
  const markers = await client().send(new ListObjectsV2Command({ Bucket: bucket(), Prefix: `${INTERNAL_PREFIX}visibility/`, MaxKeys: 1000 }));
  for (const marker of markers.Contents || []) {
    const encoded = marker.Key?.split('/').at(-1)?.replace(/\.json$/, '');
    if (!encoded) continue;
    try { visibility.add(Buffer.from(encoded, 'base64url').toString()); } catch { /* Ignore malformed internal metadata. */ }
  }
  const folders = (result.CommonPrefixes || []).flatMap(({ Prefix }) => Prefix && !Prefix.startsWith(INTERNAL_PREFIX) ? [{ key: Prefix, name: fileName(Prefix.slice(0, -1)), type: 'folder' as const }] : []);
  const files = (result.Contents || []).flatMap(object => {
    if (!object.Key || object.Key === safePrefix) return [];
    if (object.Key.startsWith(INTERNAL_PREFIX)) return [];
    return [{ key: object.Key, name: fileName(object.Key), type: 'file' as const, size: object.Size || 0, updatedAt: object.LastModified?.toISOString(), contentType: undefined, visibility: visibility.has(object.Key) ? 'public' as const : 'private' as const }];
  });
  return [...folders, ...files].sort((a, b) => a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1);
}

export async function signedStorageUpload(key: string, contentType: string) {
  const safeKey = normalizeStorageKey(key);
  const type = contentType.trim() || 'application/octet-stream';
  const url = await getSignedUrl(client(), new PutObjectCommand({ Bucket: bucket(), Key: safeKey, ContentType: type }), { expiresIn: 600 });
  return { key: safeKey, url, contentType: type };
}

export async function createStorageFolder(parent: string, name: string) {
  if (typeof name !== 'string' || !name.trim() || name.includes('/') || name.includes('\\')) throw new Error('Use a single folder name.');
  const key = normalizeStorageKey(`${parent}${name.trim()}`, { folder: true });
  await client().send(new PutObjectCommand({ Bucket: bucket(), Key: key, Body: '' }));
}

export async function deleteStorageEntry(key: string) {
  const safeKey = key.endsWith('/') ? normalizeStorageKey(key, { folder: true }) : normalizeStorageKey(key);
  if (!safeKey.endsWith('/')) return client().send(new DeleteObjectCommand({ Bucket: bucket(), Key: safeKey }));
  let token: string | undefined;
  do {
    const page = await client().send(new ListObjectsV2Command({ Bucket: bucket(), Prefix: safeKey, ContinuationToken: token }));
    const objects = (page.Contents || []).flatMap(item => item.Key ? [{ Key: item.Key }] : []);
    if (objects.length) await client().send(new DeleteObjectsCommand({ Bucket: bucket(), Delete: { Objects: objects, Quiet: true } }));
    token = page.NextContinuationToken;
  } while (token);
}

export async function copyStorageEntry(source: string, destination: string, removeSource = false) {
  const isFolder = source.endsWith('/');
  const from = normalizeStorageKey(source, { folder: isFolder });
  const to = normalizeStorageKey(destination, { folder: isFolder });
  if (from === to) throw new Error('Choose a different destination.');
  const s3 = client();
  const targetBucket = bucket();
  const copy = (key: string, target: string) => s3.send(new CopyObjectCommand({ Bucket: targetBucket, Key: target, CopySource: `${encodeURIComponent(targetBucket)}/${encodeURIComponent(key).replace(/%2F/g, '/')}` }));
  if (!isFolder) {
    await copy(from, to);
    if (removeSource) await s3.send(new DeleteObjectCommand({ Bucket: targetBucket, Key: from }));
    return;
  }
  let token: string | undefined;
  do {
    const page = await s3.send(new ListObjectsV2Command({ Bucket: targetBucket, Prefix: from, ContinuationToken: token }));
    for (const object of page.Contents || []) {
      if (!object.Key) continue;
      await copy(object.Key, `${to}${object.Key.slice(from.length)}`);
    }
    token = page.NextContinuationToken;
  } while (token);
  if (removeSource) await deleteStorageEntry(from);
}

export async function storagePreview(key: string) {
  const safeKey = normalizeStorageKey(key);
  const head = await client().send(new HeadObjectCommand({ Bucket: bucket(), Key: safeKey }));
  const url = await getSignedUrl(client(), new GetObjectCommand({ Bucket: bucket(), Key: safeKey, ResponseContentDisposition: 'inline' }), { expiresIn: 600 });
  return { url, contentType: head.ContentType || 'application/octet-stream', size: head.ContentLength || 0 };
}

export async function setStorageVisibility(key: string, visibility: 'private' | 'public') {
  const safeKey = normalizeStorageKey(key);
  if (visibility === 'private') { await client().send(new DeleteObjectCommand({ Bucket: bucket(), Key: visibilityKey(safeKey) })); return; }
  await client().send(new PutObjectCommand({ Bucket: bucket(), Key: visibilityKey(safeKey), Body: JSON.stringify({ key: safeKey, visibility: 'public' }), ContentType: 'application/json' }));
}

export async function createStorageShareLink(key: string, expiresIn = 86_400) {
  const safeKey = normalizeStorageKey(key);
  await client().send(new HeadObjectCommand({ Bucket: bucket(), Key: safeKey }));
  const token = crypto.randomUUID().replace(/-/g, '');
  const expiresAt = Date.now() + expiresIn * 1000;
  await client().send(new PutObjectCommand({ Bucket: bucket(), Key: shareKey(token), Body: JSON.stringify({ key: safeKey, expiresAt }), ContentType: 'application/json' }));
  return { token, expiresAt };
}

export async function publicStorageLink(token: string) {
  if (!/^[a-f0-9]{32}$/.test(token)) throw new Error('Invalid share link.');
  const marker = await client().send(new GetObjectCommand({ Bucket: bucket(), Key: shareKey(token) }));
  const parsed = JSON.parse(await marker.Body?.transformToString() || '{}') as { key?: string; expiresAt?: number };
  if (!parsed.key || !parsed.expiresAt || parsed.expiresAt < Date.now()) throw new Error('This share link has expired.');
  const safeKey = normalizeStorageKey(parsed.key);
  const head = await client().send(new HeadObjectCommand({ Bucket: bucket(), Key: safeKey }));
  const url = await getSignedUrl(client(), new GetObjectCommand({ Bucket: bucket(), Key: safeKey, ResponseContentDisposition: 'inline' }), { expiresIn: 600 });
  return { url, contentType: head.ContentType || 'application/octet-stream' };
}

export async function readStorageText(key: string) {
  const preview = await storagePreview(key);
  if (preview.size > 1_000_000 || !/^(text\/|application\/(json|javascript|xml|yaml|toml))/.test(preview.contentType)) throw new Error('Only text files up to 1 MB can be edited in the browser.');
  const object = await client().send(new GetObjectCommand({ Bucket: bucket(), Key: normalizeStorageKey(key) }));
  return { content: await object.Body?.transformToString() || '', contentType: preview.contentType };
}

export async function writeStorageText(key: string, content: string, contentType: string) {
  const safeKey = normalizeStorageKey(key);
  if (typeof content !== 'string' || Buffer.byteLength(content) > 1_000_000) throw new Error('Text content must be at most 1 MB.');
  if (!/^(text\/|application\/(json|javascript|xml|yaml|toml))/.test(contentType)) throw new Error('Unsupported text content type.');
  await client().send(new PutObjectCommand({ Bucket: bucket(), Key: safeKey, Body: content, ContentType: contentType }));
}
