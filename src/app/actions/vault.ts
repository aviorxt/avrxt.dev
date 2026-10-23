'use server';

import { verifyAdmin } from '@/lib/auth-checks';
import { createVaultMetadata, deleteEncryptedVaultItem, getVaultMetadata, normalizeEncryptedVaultItem, putEncryptedVaultItem, type EncryptedVaultItemInput } from '@/lib/vault';

async function currentUser() {
  const auth = await verifyAdmin();
  if (!auth.authorized) throw new Error('Unauthorized.');
  return auth.user;
}
function message(error: unknown) {
  if (error instanceof Error && error.message.includes('ConditionalCheckFailed')) return 'This vault item no longer exists.';
  return error instanceof Error ? error.message : 'Vault request failed.';
}

export async function createVaultMetadataAction(kdfSalt: string) {
  try {
    const user = await currentUser();
    const existing = await getVaultMetadata(user.id);
    if (existing) return { data: existing } as const;
    return { data: await createVaultMetadata(user.id, kdfSalt) } as const;
  } catch (error) { return { error: message(error) } as const; }
}

export async function saveEncryptedVaultItemAction(input: Partial<EncryptedVaultItemInput>) {
  try {
    const user = await currentUser();
    return { data: await putEncryptedVaultItem(user.id, normalizeEncryptedVaultItem(input)) } as const;
  } catch (error) { return { error: message(error) } as const; }
}

export async function deleteEncryptedVaultItemAction(vaultId: string) {
  try {
    const user = await currentUser();
    await deleteEncryptedVaultItem(user.id, vaultId);
    return { data: true } as const;
  } catch (error) { return { error: message(error) } as const; }
}
