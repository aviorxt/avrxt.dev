import test from 'node:test';
import assert from 'node:assert/strict';
import { safeReturnPath } from '../src/lib/auth-redirect';
import { uploadDetails } from '../src/lib/upload-details';
import { publicAddress, publicFetch } from '../src/lib/public-fetch';
import { renderMarkdown } from '../src/lib/render-markdown';
import { getPresignedUploadUrl, getR2Client, verifyR2Upload } from '../src/lib/r2';
import { putR2File } from '../src/lib/upload-transport';
import { NextRequest } from 'next/server';
import { GET as startLogin } from '../src/app/auth/start/route';
import { GET as callbackLogin } from '../src/app/auth/callback/route';
import { clientAddress } from '../src/lib/client-address';
import { createHmac } from 'node:crypto';

test('return paths reject external and backslash/control-character redirects', () => {
  for (const value of ['https://evil.example', '//evil.example', '/\\evil.example', '/\nevil.example', 'javascript:alert(1)']) assert.equal(safeReturnPath(value), '/');
  assert.equal(safeReturnPath('/me/admin?tab=music#upload'), '/me/admin?tab=music#upload');
});
test('gateway IP forwarding accepts only fresh authenticated headers', () => {
  const previous = process.env.GATEWAY_SHARED_SECRET;
  process.env.GATEWAY_SHARED_SECRET = 'test-gateway-secret';
  try {
    const timestamp = Date.now().toString(); const ip = '8.8.8.8';
    const headers = new Headers({ 'x-avrxt-client-ip': ip, 'x-avrxt-client-time': timestamp,
      'x-avrxt-client-signature': createHmac('sha256', 'test-gateway-secret').update(`${timestamp}\n${ip}`).digest('hex') });
    assert.equal(clientAddress(headers), ip);
    headers.set('x-avrxt-client-ip', '1.1.1.1'); assert.notEqual(clientAddress(headers), '1.1.1.1');
    headers.set('x-avrxt-client-time', '1000000000000'); assert.notEqual(clientAddress(headers), ip);
  } finally {
    if (previous === undefined) delete process.env.GATEWAY_SHARED_SECRET;
    else process.env.GATEWAY_SHARED_SECRET = previous;
  }
});
test('login emits a browser-bound PKCE transaction and rejects substituted callback state', async () => {
  const response = await startLogin(new NextRequest('http://localhost:3000/auth/start?provider=github&next=%2F%5Cevil.example'));
  const location = new URL(response.headers.get('location')!);
  assert.equal(location.searchParams.get('code_challenge_method'), 'S256');
  assert.ok(location.searchParams.get('code_challenge'));
  const cookie = response.cookies.get('avrxt_oauth_transaction')!;
  const transaction = JSON.parse(cookie.value);
  assert.equal(transaction.next, '/');
  assert.equal(transaction.state, location.searchParams.get('state'));
  assert.ok(transaction.verifier);
  const callback = await callbackLogin(new NextRequest('http://localhost:3000/auth/callback?code=unused&state=substituted&next=%2F', {
    headers: { cookie: `avrxt_oauth_transaction=${encodeURIComponent(cookie.value)}` },
  }));
  assert.match(callback.headers.get('location')!, /oauth_callback_failed/);
  assert.equal(callback.cookies.get('avrxt_oauth_transaction')?.value, '');
  const withoutCookie = await callbackLogin(new NextRequest('http://localhost:3000/auth/callback?code=unused&state=anything'));
  assert.match(withoutCookie.headers.get('location')!, /oauth_callback_failed/);
});
test('uploads rewrite personal filenames, use MIME extensions and remain unique', () => {
  const first = uploadDetails('../../my personal photo.exe', 'image/jpeg', 42);
  const second = uploadDetails('photo.jpg', 'image/jpeg', 42);
  assert.match(first.fileName, /^avrxt-[a-f0-9-]{36}\.jpg$/);
  assert.notEqual(first.fileName, second.fileName);
  assert.equal(first.folder, 'i');
  assert.equal(uploadDetails('sound.wav', '', 42).contentType, 'audio/wav');
  assert.equal(uploadDetails('movie.bin', 'video/mp4', 100 * 1024 ** 2).folder, 'v');
  assert.throws(() => uploadDetails('photo.png', 'image/png', 10 * 1024 ** 2 + 1));
  assert.throws(() => uploadDetails('icon.svg', 'image/svg+xml', 42));
});
test('upload network, timeout and R2 rejection errors are actionable without leaking signatures', async () => {
  const original = globalThis.fetch;
  const file = new File(['data'], 'photo.png', { type: 'image/png' });
  const prepared = { uploadUrl: 'https://test.r2.cloudflarestorage.com/bucket/file?secret=do-not-leak', contentType: 'image/png' };
  try {
    globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
    await assert.rejects(putR2File(file, prepared), /bucket CORS/);
    globalThis.fetch = async () => { throw new DOMException('expired', 'TimeoutError'); };
    await assert.rejects(putR2File(file, prepared), /timed out/);
    globalThis.fetch = async () => new Response('<Code>SignatureDoesNotMatch</Code>', { status: 403 });
    await assert.rejects(putR2File(file, prepared), /403, SignatureDoesNotMatch/);
    globalThis.fetch = async (_url, init) => {
      assert.equal(init?.method, 'PUT'); assert.equal(init?.body, file);
      assert.equal(new Headers(init?.headers).get('content-type'), 'image/png');
      assert.equal(init?.credentials, 'omit'); return new Response(null, { status: 200 });
    };
    await putR2File(file, prepared);
  } finally { globalThis.fetch = original; }
});
test('R2 PUT signing excludes empty-body checksums and binds Content-Type', async () => {
  Object.assign(process.env, { R2_ENDPOINT: 'https://test.r2.cloudflarestorage.com', R2_ACCESS_KEY_ID: 'test', R2_SECRET_ACCESS_KEY: 'test', R2_BUCKET_NAME: 'assets' });
  const result = await getPresignedUploadUrl('avrxt-test.png', 'image/png', 'i');
  const url = new URL(result.uploadUrl);
  assert.equal(url.searchParams.get('x-amz-checksum-crc32'), null);
  assert.equal(url.searchParams.get('x-amz-sdk-checksum-algorithm'), null);
  assert.ok(url.searchParams.get('X-Amz-SignedHeaders')?.includes('content-type'));
  assert.equal(url.searchParams.get('X-Amz-Expires'), '600');
});
test('R2 completion rejects mismatched files without bucket-policy calls', async () => {
  const client = getR2Client(); const original = client.send;
  const calls: any[] = [];
  client.send = (async (command: any) => {
    calls.push(command);
    if (command.constructor.name === 'HeadObjectCommand') return { ContentLength: 99, ContentType: 'image/png' };
    return {};
  }) as typeof client.send;
  try {
    await assert.rejects(verifyR2Upload('i/avrxt-12345678-1234-1234-1234-123456789012.png', 'image/png', 42));
    assert.ok(calls.some(item => item.constructor.name === 'DeleteObjectCommand'));
    assert.deepEqual(calls.map(item => item.constructor.name), ['HeadObjectCommand', 'DeleteObjectCommand']);
  } finally { client.send = original; }
});
test('public fetch rejects private, mapped and reserved addresses', async () => {
  for (const ip of ['127.0.0.1', '10.0.0.1', '192.168.1.1', '169.254.169.254', '::1', '::ffff:7f00:1', 'fc00::1', '2001:db8::1', '2002:7f00:1::']) assert.equal(publicAddress(ip), false, ip);
  assert.equal(publicAddress('8.8.8.8'), true);
  assert.equal(publicAddress('2606:4700:4700::1111'), true);
  await assert.rejects(publicFetch(new URL('http://127.0.0.1'), AbortSignal.timeout(1000)));
  await assert.rejects(publicFetch(new URL('https://example.com:8443'), AbortSignal.timeout(1000)));
});
test('shared Markdown rendering keeps content and removes privileged HTML', async () => {
  const html = await renderMarkdown('# Article\n\n**Useful text**\n\n<img src="x" onerror="alert(1)"><iframe src="https://evil.example"></iframe><script>alert(1)</script>\n\n[bad](javascript:alert(1))');
  assert.ok(html.includes('<h1>Article</h1>'));
  assert.ok(html.includes('<strong>Useful text</strong>'));
  assert.doesNotMatch(html, /onerror|<iframe|<script|href="javascript:/i);
});
