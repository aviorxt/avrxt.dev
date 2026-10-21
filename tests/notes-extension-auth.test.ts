import test from 'node:test';
import assert from 'node:assert/strict';
import { createNotesExtensionToken, extensionIdFromOrigin, extensionIdFromRedirect, verifyNotesExtensionToken } from '../src/lib/notes-extension-auth';

const extensionId = 'a'.repeat(32);
const user = { id: '1269352892146384957', user_metadata: { user_name: 'avrxt' } };

test('notes extension tokens are scoped to the configured Chrome extension', () => {
  const previousSecret = process.env.AUTH_SESSION_SECRET;
  const previousIds = process.env.NOTES_EXTENSION_IDS;
  process.env.AUTH_SESSION_SECRET = 'a-test-only-auth-session-secret-with-more-than-32-characters';
  process.env.NOTES_EXTENSION_IDS = extensionId;
  try {
    assert.equal(extensionIdFromRedirect(`https://${extensionId}.chromiumapp.org/avrxt-notes`), extensionId);
    assert.equal(extensionIdFromOrigin(`chrome-extension://${extensionId}`), extensionId);
    assert.equal(extensionIdFromRedirect('https://evil.example/avrxt-notes'), null);
    assert.equal(extensionIdFromOrigin('https://www.avrxt.dev'), null);
    const token = createNotesExtensionToken(user, extensionId);
    assert.equal(verifyNotesExtensionToken(token, extensionId)?.userId, user.id);
    assert.equal(verifyNotesExtensionToken(token, 'b'.repeat(32)), null);
    assert.equal(verifyNotesExtensionToken(`${token}tampered`, extensionId), null);
  } finally {
    if (previousSecret === undefined) delete process.env.AUTH_SESSION_SECRET; else process.env.AUTH_SESSION_SECRET = previousSecret;
    if (previousIds === undefined) delete process.env.NOTES_EXTENSION_IDS; else process.env.NOTES_EXTENSION_IDS = previousIds;
  }
});
