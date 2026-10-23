import { argon2idAsync } from '@noble/hashes/argon2.js';

export type VaultSecret = {
  id: string;
  title: string;
  username: string;
  password: string;
  url: string;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type EncryptedSecret = Pick<VaultSecret, never> & { ciphertext: string; iv: string };

const encoder = new TextEncoder();
const decoder = new TextDecoder();
export const VAULT_KDF = { t: 2, m: 19_456, p: 1, dkLen: 32, maxmem: 32 * 1024 * 1024 } as const;

function toBase64(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
function fromBase64(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function createVaultSalt() { return toBase64(crypto.getRandomValues(new Uint8Array(16))); }

export async function deriveVaultKey(masterPassword: string, saltBase64: string): Promise<CryptoKey> {
  if (masterPassword.length < 12) throw new Error('Use at least 12 characters for the master password.');
  const material = await argon2idAsync(encoder.encode(masterPassword), fromBase64(saltBase64), VAULT_KDF);
  return crypto.subtle.importKey('raw', material, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encryptVaultSecret(key: CryptoKey, secret: VaultSecret): Promise<EncryptedSecret> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = encoder.encode(JSON.stringify(secret));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  return { ciphertext: toBase64(new Uint8Array(ciphertext)), iv: toBase64(iv) };
}

export async function decryptVaultSecret(key: CryptoKey, encrypted: EncryptedSecret): Promise<VaultSecret> {
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(encrypted.iv) }, key, fromBase64(encrypted.ciphertext));
  const value: unknown = JSON.parse(decoder.decode(plaintext));
  if (!value || typeof value !== 'object') throw new Error('Invalid vault item.');
  const secret = value as Partial<VaultSecret>;
  if (![secret.id, secret.title, secret.username, secret.password, secret.url, secret.note, secret.createdAt, secret.updatedAt].every((item) => typeof item === 'string')) throw new Error('Invalid vault item.');
  return secret as VaultSecret;
}

const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const lower = 'abcdefghijkmnopqrstuvwxyz';
const digits = '23456789';
const symbols = '!@#$%^&*()-_=+[]{}:,.?';
function randomIndex(length: number) {
  const limit = 256 - (256 % length);
  const byte = new Uint8Array(1);
  do { crypto.getRandomValues(byte); } while (byte[0] >= limit);
  return byte[0] % length;
}
export function generatePassword(length = 24, options = { upper: true, lower: true, digits: true, symbols: true }) {
  const size = Math.max(16, Math.min(64, Math.floor(length)));
  const groups = [options.upper ? upper : '', options.lower ? lower : '', options.digits ? digits : '', options.symbols ? symbols : ''].filter((group): group is string => Boolean(group));
  if (!groups.length) throw new Error('Choose at least one character type.');
  const all = groups.join('');
  const result = groups.map((group) => group[randomIndex(group.length)]);
  while (result.length < size) result.push(all[randomIndex(all.length)]);
  for (let index = result.length - 1; index > 0; index--) { const next = randomIndex(index + 1); [result[index], result[next]] = [result[next], result[index]]; }
  return result.join('');
}
