'use server';

import { verifyAdmin } from '@/lib/auth-checks';
import { copyStorageEntry, createStorageFolder, createStorageShareLink, deleteStorageEntry, listStorage, readStorageText, setStorageVisibility, signedStorageUpload, storagePreview, writeStorageText } from '@/lib/s3-storage';

async function guarded<T>(work: () => Promise<T>) {
  const auth = await verifyAdmin();
  if (!auth.authorized) return { error: 'Unauthorized.' } as const;
  try { return { data: await work() } as const; }
  catch (error) { return { error: error instanceof Error ? error.message : 'Storage operation failed.' } as const; }
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
