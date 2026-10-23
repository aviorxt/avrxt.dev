'use server';

import { verifyAdmin } from '@/lib/auth-checks';
import { copyStorageEntry, createStorageFolder, createStorageShareLink, deleteStorageEntry, listStorage, readStorageText, setStorageVisibility, signedStorageUpload, storagePreview, writeStorageText } from '@/lib/s3-storage';

function safeStorageError(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  return ['Unauthorized.', 'Invalid storage path.', 'Use a single folder name.', 'Choose a different destination.', 'Only text files up to 1 MB can be edited in the browser.', 'Text content must be at most 1 MB.', 'Unsupported text content type.', 'This share link has expired.', 'Invalid share link.'].includes(message)
    ? message
    : 'Storage operation failed. Please try again.';
}

async function guarded<T>(work: () => Promise<T>) {
  const auth = await verifyAdmin();
  if (!auth.authorized) return { error: 'Unauthorized.' } as const;
  try { return { data: await work() } as const; }
  catch (error) { return { error: safeStorageError(error) } as const; }
}

export async function listStorageAction(prefix = '') { return guarded(() => listStorage(prefix)); }
export async function createFolderAction(parent: string, name: string) { return guarded(async () => { await createStorageFolder(parent, name); }); }
export async function deleteStorageAction(key: string) { return guarded(async () => { await deleteStorageEntry(key); }); }
export async function copyStorageAction(source: string, destination: string) { return guarded(async () => { await copyStorageEntry(source, destination); }); }
export async function moveStorageAction(source: string, destination: string) { return guarded(async () => { await copyStorageEntry(source, destination, true); }); }
export async function getStorageUploadAction(key: string, contentType: string) { return guarded(() => signedStorageUpload(key, contentType)); }
export async function previewStorageAction(key: string) { return guarded(() => storagePreview(key)); }
export async function readStorageTextAction(key: string) { return guarded(() => readStorageText(key)); }
export async function writeStorageTextAction(key: string, content: string, contentType: string) { return guarded(async () => { await writeStorageText(key, content, contentType); }); }
export async function setStorageVisibilityAction(key: string, visibility: 'private' | 'public') { return guarded(async () => { await setStorageVisibility(key, visibility); }); }
export async function createStorageShareAction(key: string) { return guarded(() => createStorageShareLink(key)); }
