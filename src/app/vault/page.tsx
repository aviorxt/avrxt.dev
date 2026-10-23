import type { Metadata } from 'next';
import { protectAdminPage } from '@/lib/auth-checks';
import { getVaultMetadata, listEncryptedVaultItems } from '@/lib/vault';
import VaultClient from './VaultClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Vault | AVRXT', robots: { index: false, follow: false } };

export default async function VaultPage() {
  const user = await protectAdminPage();
  const [metadata, items] = await Promise.all([getVaultMetadata(user.id), listEncryptedVaultItems(user.id)]);
  return <VaultClient initialMetadata={metadata} initialItems={items} />;
}
