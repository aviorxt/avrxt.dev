import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DeleteCommand, DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

export const VAULT_META_ID = '__vault_meta';

export type VaultMetadata = {
  userId: string;
  vaultId: typeof VAULT_META_ID;
  kdfSalt: string;
  version: 1;
  createdAt: string;
  updatedAt: string;
};

export type EncryptedVaultItem = {
  userId: string;
  vaultId: string;
  ciphertext: string;
  iv: string;
  createdAt: string;
  updatedAt: string;
};

export type EncryptedVaultItemInput = Pick<EncryptedVaultItem, 'vaultId' | 'ciphertext' | 'iv' | 'createdAt' | 'updatedAt'>;

function tableName() {
  const table = process.env.VAULT_DYNAMODB_TABLE_NAME;
  if (!table) throw new Error('Vault is not configured. Set VAULT_DYNAMODB_TABLE_NAME.');
  return table;
}

function client() {
  const region = process.env.AWS_REGION;
  if (!region) throw new Error('Vault is not configured. Set AWS_REGION.');
  return DynamoDBDocumentClient.from(new DynamoDBClient({ region }), { marshallOptions: { removeUndefinedValues: true } });
}

function isString(value: unknown, max = 100_000): value is string { return typeof value === 'string' && value.length > 0 && value.length <= max; }
function isBase64(value: unknown, max: number) { return isString(value, max) && /^[A-Za-z0-9+/]+={0,2}$/.test(value); }
function isDate(value: unknown): value is string { return typeof value === 'string' && !Number.isNaN(Date.parse(value)); }
function isVaultId(value: unknown): value is string { return typeof value === 'string' && /^[a-f0-9-]{36}$/i.test(value); }

function isMetadata(value: unknown): value is VaultMetadata {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<VaultMetadata>;
  return typeof item.userId === 'string' && item.vaultId === VAULT_META_ID && isBase64(item.kdfSalt, 128) && item.version === 1 && isDate(item.createdAt) && isDate(item.updatedAt);
}

function isEncryptedItem(value: unknown): value is EncryptedVaultItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<EncryptedVaultItem>;
  return typeof item.userId === 'string' && isVaultId(item.vaultId) && isBase64(item.ciphertext, 550_000) && isBase64(item.iv, 32) && isDate(item.createdAt) && isDate(item.updatedAt);
}

export function normalizeEncryptedVaultItem(value: Partial<EncryptedVaultItemInput>): EncryptedVaultItemInput {
  if (!isVaultId(value.vaultId)) throw new Error('Invalid vault item.');
  if (!isBase64(value.ciphertext, 550_000)) throw new Error('Invalid encrypted vault data.');
  if (!isBase64(value.iv, 32)) throw new Error('Invalid vault encryption nonce.');
  if (!isDate(value.createdAt) || !isDate(value.updatedAt)) throw new Error('Invalid vault timestamps.');
  return { vaultId: value.vaultId as string, ciphertext: value.ciphertext as string, iv: value.iv as string, createdAt: value.createdAt as string, updatedAt: value.updatedAt as string };
}

export async function getVaultMetadata(userId: string) {
  const result = await client().send(new QueryCommand({
    TableName: tableName(), KeyConditionExpression: '#userId = :userId AND #vaultId = :vaultId',
    ExpressionAttributeNames: { '#userId': 'userId', '#vaultId': 'vaultId' },
    ExpressionAttributeValues: { ':userId': userId, ':vaultId': VAULT_META_ID }, Limit: 1,
  }));
  return isMetadata(result.Items?.[0]) ? result.Items[0] : null;
}

export async function createVaultMetadata(userId: string, kdfSalt: string) {
  if (!isBase64(kdfSalt, 128)) throw new Error('Invalid vault salt.');
  const now = new Date().toISOString();
  const metadata: VaultMetadata = { userId, vaultId: VAULT_META_ID, kdfSalt, version: 1, createdAt: now, updatedAt: now };
  await client().send(new PutCommand({ TableName: tableName(), Item: metadata, ConditionExpression: 'attribute_not_exists(#userId) AND attribute_not_exists(#vaultId)', ExpressionAttributeNames: { '#userId': 'userId', '#vaultId': 'vaultId' } }));
  return metadata;
}

export async function listEncryptedVaultItems(userId: string) {
  const items: EncryptedVaultItem[] = [];
  let exclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const result = await client().send(new QueryCommand({
      TableName: tableName(), KeyConditionExpression: '#userId = :userId',
      FilterExpression: '#vaultId <> :metaId', ExpressionAttributeNames: { '#userId': 'userId', '#vaultId': 'vaultId' },
      ExpressionAttributeValues: { ':userId': userId, ':metaId': VAULT_META_ID }, ExclusiveStartKey: exclusiveStartKey,
    }));
    items.push(...(result.Items || []).filter(isEncryptedItem));
    exclusiveStartKey = result.LastEvaluatedKey;
  } while (exclusiveStartKey);
  return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function putEncryptedVaultItem(userId: string, input: EncryptedVaultItemInput) {
  const item: EncryptedVaultItem = { userId, ...normalizeEncryptedVaultItem(input) };
  await client().send(new PutCommand({ TableName: tableName(), Item: item }));
  return item;
}

export async function deleteEncryptedVaultItem(userId: string, vaultId: string) {
  if (!isVaultId(vaultId)) throw new Error('Invalid vault item.');
  await client().send(new DeleteCommand({ TableName: tableName(), Key: { userId, vaultId }, ConditionExpression: 'attribute_exists(#userId) AND attribute_exists(#vaultId)', ExpressionAttributeNames: { '#userId': 'userId', '#vaultId': 'vaultId' } }));
}
