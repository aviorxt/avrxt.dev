import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getGuestbookUser, guestbookAuthorId } from '@/lib/guestbook-auth';
import { readJsonLimited, RequestBodyError } from '@/lib/read-json-limited';
import { isGuestbookEnabled } from '@/lib/guestbook-config';
import { verifyTurnstile } from '@/lib/turnstile';
import { isJsonRequest, isTrustedMutationOrigin, isUuid } from '@/lib/request-security';
import { isRateLimited } from '@/lib/api-rate-limit';
import { writeAuditLog } from '@/lib/audit-logs';

function profile(user: Awaited<ReturnType<typeof getGuestbookUser>> & {}) {
  if (!user) throw new Error('AUTH_REQUIRED');
  const metadata = user.user_metadata;
  const displayName = [metadata.full_name, metadata.user_name].find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim().slice(0, 80) || 'Signed in visitor';
  const avatarUrl = typeof metadata.avatar_url === 'string' && /^https:\/\//.test(metadata.avatar_url) ? metadata.avatar_url : null;
  return { author_id: guestbookAuthorId(user), display_name: displayName, avatar_url: avatarUrl, provider: user.provider };
}

async function currentUser() {
  if (!await isGuestbookEnabled()) return { supabase: null, user: null };
  return { supabase: createAdminClient(), user: await getGuestbookUser() };
}

export async function POST(request: NextRequest) {
  try {
    if (!isTrustedMutationOrigin(request)) return NextResponse.json({ error: 'CROSS_SITE_REQUEST_REJECTED' }, { status: 403 });
    if (!isJsonRequest(request)) return NextResponse.json({ error: 'UNSUPPORTED_CONTENT_TYPE' }, { status: 415 });
    const { supabase, user } = await currentUser();
    if (!supabase) return NextResponse.json({ error: 'GUESTBOOK_DISABLED' }, { status: 403 });
    if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    if (await isRateLimited(request.headers, 'guestbook-write', 8, 60_000, guestbookAuthorId(user))) return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });
    const body = await readJsonLimited(request, 4096);
    const verification = await verifyTurnstile('guestbook', (body as { turnstileToken?: unknown })?.turnstileToken, request);
    if (!verification.success) return NextResponse.json({ error: verification.error }, { status: 403 });
    const message = typeof (body as { message?: unknown })?.message === 'string' ? (body as { message: string }).message.trim().replace(/\s+/g, ' ') : '';
    if (message.length < 1 || message.length > 600) return NextResponse.json({ error: 'MESSAGE_MUST_BE_BETWEEN_1_AND_600_CHARACTERS' }, { status: 400 });
    const author = profile(user);
    const { data, error } = await supabase.from('guestbook_entries').insert({ ...author, message }).select().single();
    if (error) throw error;
    await writeAuditLog({ actor_id: author.author_id, actor_name: author.display_name, actor_role: 'user', event_type: 'guestbook', action: 'create', category: 'guestbook', severity: 'info', status: 'success', message: 'A guestbook entry was created.', metadata: { provider: author.provider } });
    return NextResponse.json({ entry: data }, { status: 201 });
  } catch (error) {
    if (error instanceof RequestBodyError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'COULD_NOT_SIGN_GUESTBOOK' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!isTrustedMutationOrigin(request)) return NextResponse.json({ error: 'CROSS_SITE_REQUEST_REJECTED' }, { status: 403 });
    if (!isJsonRequest(request)) return NextResponse.json({ error: 'UNSUPPORTED_CONTENT_TYPE' }, { status: 415 });
    const { supabase, user } = await currentUser();
    if (!supabase) return NextResponse.json({ error: 'GUESTBOOK_DISABLED' }, { status: 403 });
    if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    if (await isRateLimited(request.headers, 'guestbook-edit', 12, 60_000, guestbookAuthorId(user))) return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });
    const body = await readJsonLimited(request, 4096) as { id?: unknown; message?: unknown; turnstileToken?: unknown };
    const verification = await verifyTurnstile('guestbook', body.turnstileToken, request);
    if (!verification.success) return NextResponse.json({ error: verification.error }, { status: 403 });
    const id = typeof body.id === 'string' ? body.id : '';
    const message = typeof body.message === 'string' ? body.message.trim().replace(/\s+/g, ' ') : '';
    if (!isUuid(id) || message.length < 1 || message.length > 600) return NextResponse.json({ error: 'INVALID_ENTRY' }, { status: 400 });
    const { data, error } = await supabase.from('guestbook_entries').update({ message, updated_at: new Date().toISOString() }).eq('id', id).eq('author_id', guestbookAuthorId(user)).select().single();
    if (error) throw error;
    const author = profile(user);
    await writeAuditLog({ actor_id: author.author_id, actor_name: author.display_name, actor_role: 'user', event_type: 'guestbook', action: 'update', category: 'guestbook', severity: 'info', status: 'success', message: 'A guestbook entry was updated.', metadata: { provider: author.provider } });
    return NextResponse.json({ entry: data });
  } catch (error) {
    if (error instanceof RequestBodyError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'COULD_NOT_UPDATE_ENTRY' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isTrustedMutationOrigin(request)) return NextResponse.json({ error: 'CROSS_SITE_REQUEST_REJECTED' }, { status: 403 });
  const { supabase, user } = await currentUser();
  if (!supabase) return NextResponse.json({ error: 'GUESTBOOK_DISABLED' }, { status: 403 });
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  if (await isRateLimited(request.headers, 'guestbook-delete', 8, 60_000, guestbookAuthorId(user))) return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });
  const verification = await verifyTurnstile('guestbook', request.headers.get('x-turnstile-token'), request);
  if (!verification.success) return NextResponse.json({ error: verification.error }, { status: 403 });
  const id = request.nextUrl.searchParams.get('id');
  if (!isUuid(id)) return NextResponse.json({ error: 'INVALID_ENTRY' }, { status: 400 });
  const { error } = await supabase.from('guestbook_entries').delete().eq('id', id).eq('author_id', guestbookAuthorId(user));
  if (error) return NextResponse.json({ error: 'COULD_NOT_DELETE_ENTRY' }, { status: 500 });
  const author = profile(user);
  await writeAuditLog({ actor_id: author.author_id, actor_name: author.display_name, actor_role: 'user', event_type: 'guestbook', action: 'delete', category: 'guestbook', severity: 'warning', status: 'success', message: 'A guestbook entry was deleted.', metadata: { provider: author.provider } });
  return new NextResponse(null, { status: 204 });
}
