import test from 'node:test';
import assert from 'node:assert/strict';
import { recoverR2Upload } from '../src/lib/upload-recovery';
import { R2UploadError } from '../src/lib/upload-transport';
import { validateR2UploadKey } from '../src/lib/upload-details';
import { assertR2UploadOrigin } from '../src/lib/r2-upload-origin';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const cors = JSON.parse(readFileSync(join(process.cwd(), 'cloudflare/r2-cors.json'), 'utf8')) as { AllowedOrigins: string[]; AllowedMethods: string[]; AllowedHeaders: string[] }[];

const prepared = { key: 'i/avrxt-12345678-1234-1234-1234-123456789012.png', contentType: 'image/png', publicUrl: 'https://cdn.avrxt.dev/i/test.png', fileName: 'test.png', uploadUrl: 'https://test.r2.cloudflarestorage.com?secret=never-log' };
const wait = async () => {};
test('a lost upload response is recovered by HEAD without a second PUT or a new key', async () => {
    let puts = 0, refreshes = 0;
    const result = await recoverR2Upload(prepared, { put: async () => { puts++; throw new R2UploadError('Network unavailable', true); }, verify: async () => {}, refresh: async p => { refreshes++; return p; }, wait });
    assert.equal(result.key, prepared.key); assert.equal(puts, 1); assert.equal(refreshes, 0);
});
test('transient failure refreshes the URL and retries once using exactly the same object', async () => {
    let puts = 0, checks = 0;
    const urls: string[] = [];
    await recoverR2Upload(prepared, { put: async p => { urls.push(p.uploadUrl); if (++puts === 1) throw new R2UploadError('Network unavailable', true); }, verify: async () => { if (++checks === 1) throw new Error('Not found'); }, refresh: async p => ({ ...p, uploadUrl: 'https://test.r2.cloudflarestorage.com?renewed' }), wait });
    assert.equal(puts, 2); assert.equal(checks, 2); assert.notEqual(urls[0], urls[1]);
});
test('persistent failures stop after two PUTs and credential rejection is not retried', async () => {
    for (const retryable of [true, false]) {
        let puts = 0;
        await assert.rejects(recoverR2Upload(prepared, { put: async () => { puts++; throw new R2UploadError('Safe upload error', retryable); }, verify: async () => { throw new Error('Not found'); }, refresh: async p => p, wait }), /Safe upload error/);
        assert.equal(puts, retryable ? 2 : 1);
    }
});
test('post-upload verification outage retries HEAD without reuploading and still requires verification', async () => {
    let puts = 0, checks = 0;
    await assert.rejects(recoverR2Upload(prepared, { put: async () => { puts++; }, verify: async () => { checks++; throw new Error('Verification unavailable'); }, refresh: async p => p, wait }), /Verification unavailable/);
    assert.equal(puts, 1); assert.equal(checks, 2);
});
test('renewal rejects a changed asset and validates approved folder, MIME extension, and size', async () => {
    await assert.rejects(recoverR2Upload(prepared, { put: async () => { throw new R2UploadError('Network error', true); }, verify: async () => { throw new Error('Not found'); }, refresh: async p => ({ ...p, key: 'i/other.png' }), wait }), /changed the approved asset/);
    assert.equal(validateR2UploadKey(prepared.key, 'image/png', 42).folder, 'i');
    for (const [key, mime, size] of [[prepared.key, 'video/mp4', 42], [prepared.key, 'image/jpeg', 42], ['../file', 'image/png', 42], [prepared.key, 'image/png', 11 * 1024 ** 2]] as const) assert.throws(() => validateR2UploadKey(key, mime, size));
});
test('saved policy covers known production, staging and local origins without wildcard access', () => {
    for (const origin of ['https://www.avrxt.dev', 'https://avrxt.dev', 'https://staging.avrxt.dev', 'http://localhost:3007']) {
        assert.doesNotThrow(() => assertR2UploadOrigin(origin));
        assert.ok(cors.some(rule => rule.AllowedOrigins.includes(origin) && rule.AllowedMethods.includes('PUT') && rule.AllowedHeaders.includes('Content-Type')));
    }
    assert.throws(() => assertR2UploadOrigin('https://evil.example'));
    assert.ok(cors.every(rule => !rule.AllowedOrigins.includes('*')));
});
