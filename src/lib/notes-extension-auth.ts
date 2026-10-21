import { createHmac, timingSafeEqual } from 'node:crypto';

const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const EXTENSION_ID = /^[a-p]{32}$/;

type ExtensionToken = {
  version: 1;
  userId: string;
  createdBy: string;
  extensionId: string;
  exp: number;
};

function secret() {
  const value = process.env.AUTH_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('AUTH_SESSION_SECRET must contain at least 32 characters.');
  return value;
}

function sign(value: string) {
  return createHmac('sha256', secret()).update(`avrxt-notes-extension.${value}`).digest('base64url');
}

function allowedExtensionIds() {
  return new Set((process.env.NOTES_EXTENSION_IDS || '').split(',').map((id) => id.trim()).filter((id) => EXTENSION_ID.test(id)));
}

export function extensionIdFromRedirect(redirectUri: string) {
  try {
    const url = new URL(redirectUri);
    const extensionId = url.hostname.replace(/\.chromiumapp\.org$/i, '');
    if (url.protocol !== 'https:' || url.hostname !== `${extensionId}.chromiumapp.org` || !EXTENSION_ID.test(extensionId)) return null;
    return allowedExtensionIds().has(extensionId) ? extensionId : null;
  } catch { return null; }
}

export function extensionIdFromOrigin(origin: string | null) {
  if (!origin) return null;
  try {
    const url = new URL(origin);
    if (url.protocol !== 'chrome-extension:' || !EXTENSION_ID.test(url.hostname)) return null;
    return allowedExtensionIds().has(url.hostname) ? url.hostname : null;
  } catch { return null; }
}

export function createNotesExtensionToken(user: { id: string; user_metadata: { user_name?: string; full_name?: string } }, extensionId: string) {
  const payload: ExtensionToken = {
    version: 1,
    userId: user.id,
    createdBy: user.user_metadata.user_name || user.user_metadata.full_name || user.id,
    extensionId,
    exp: Math.floor(Date.now() / 1000) + TOKEN_MAX_AGE_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}.${sign(encoded)}`;
}

export function verifyNotesExtensionToken(value: string | null, extensionId: string): ExtensionToken | null {
  if (!value) return null;
  const [encoded, received] = value.split('.');
  if (!encoded || !received) return null;
  const expected = sign(encoded);
  if (received.length !== expected.length || !timingSafeEqual(Buffer.from(received), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as Partial<ExtensionToken>;
    if (payload.version !== 1 || payload.extensionId !== extensionId || typeof payload.userId !== 'string' || !/^\d{5,}$/.test(payload.userId) || typeof payload.createdBy !== 'string' || typeof payload.exp !== 'number' || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload as ExtensionToken;
  } catch { return null; }
}
