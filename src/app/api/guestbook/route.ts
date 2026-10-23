import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getGuestbookUser, guestbookAuthorId } from '@/lib/guestbook-auth';
import { readJsonLimited, RequestBodyError } from '@/lib/read-json-limited';
import { isGuestbookEnabled } from '@/lib/guestbook-config';

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

function hasTrustedOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  return !origin || origin === request.nextUrl.origin || origin === 'https://www.avrxt.dev' || origin === 'https://avrxt.dev';
}

export async function POST(request: NextRequest) {
  try {
    if (!hasTrustedOrigin(request)) return NextResponse.json({ error: 'CROSS_SITE_REQUEST_REJECTED' }, { status: 403 });
    const { supabase, user } = await currentUser();
    if (!supabase) return NextResponse.json({ error: 'GUESTBOOK_DISABLED' }, { status: 403 });
    if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    const body = await readJsonLimited(request, 2048);
    const message = typeof (body as { message?: unknown })?.message === 'string' ? (body as { message: string }).message.trim().replace(/\s+/g, ' ') : '';
    if (message.length < 1 || message.length > 600) return NextResponse.json({ error: 'MESSAGE_MUST_BE_BETWEEN_1_AND_600_CHARACTERS' }, { status: 400 });
    const { data, error } = await supabase.from('guestbook_entries').insert({ ...profile(user), message }).select().single();
    if (error) throw error;
    return NextResponse.json({ entry: data }, { status: 201 });
  } catch (error) {
    if (error instanceof RequestBodyError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'COULD_NOT_SIGN_GUESTBOOK' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!hasTrustedOrigin(request)) return NextResponse.json({ error: 'CROSS_SITE_REQUEST_REJECTED' }, { status: 403 });
    const { supabase, user } = await currentUser();
    if (!supabase) return NextResponse.json({ error: 'GUESTBOOK_DISABLED' }, { status: 403 });
    if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    const body = await readJsonLimited(request, 2048) as { id?: unknown; message?: unknown };
    const id = typeof body.id === 'string' ? body.id : '';
    const message = typeof body.message === 'string' ? body.message.trim().replace(/\s+/g, ' ') : '';
    if (!id || message.length < 1 || message.length > 600) return NextResponse.json({ error: 'INVALID_ENTRY' }, { status: 400 });
    const { data, error } = await supabase.from('guestbook_entries').update({ message, updated_at: new Date().toISOString() }).eq('id', id).eq('author_id', guestbookAuthorId(user)).select().single();
    if (error) throw error;
    return NextResponse.json({ entry: data });
  } catch (error) {
    if (error instanceof RequestBodyError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'COULD_NOT_UPDATE_ENTRY' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return NextResponse.json({ error: 'CROSS_SITE_REQUEST_REJECTED' }, { status: 403 });
  const { supabase, user } = await currentUser();
  if (!supabase) return NextResponse.json({ error: 'GUESTBOOK_DISABLED' }, { status: 403 });
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'INVALID_ENTRY' }, { status: 400 });
  const { error } = await supabase.from('guestbook_entries').delete().eq('id', id).eq('author_id', guestbookAuthorId(user));
  return error ? NextResponse.json({ error: 'COULD_NOT_DELETE_ENTRY' }, { status: 500 }) : new NextResponse(null, { status: 204 });
}
