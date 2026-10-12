import { timingSafeEqual } from 'node:crypto';

export async function databaseMonitorResponse(request: Request, secret: string | undefined, probe: (signal: AbortSignal) => PromiseLike<{ error: unknown }>) {
  const supplied = request.headers.get('authorization') || '';
  const expected = `Bearer ${secret || ''}`;
  const headers = { 'Cache-Control': 'no-store, max-age=0' };
  if (!secret || secret.length < 32 || supplied.length > 256 || Buffer.byteLength(supplied) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers });
  }
  try {
    const result = await probe(AbortSignal.timeout(5000));
    if (result.error) throw new Error('Database probe failed');
    return Response.json({ status: 'healthy' }, { headers });
  } catch { return Response.json({ status: 'unavailable' }, { status: 503, headers }); }
}
