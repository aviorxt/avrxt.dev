import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createNote, normalizeNoteInput } from '@/lib/notes';
import { extensionIdFromOrigin, verifyNotesExtensionToken } from '@/lib/notes-extension-auth';
import { readJsonLimited, RequestBodyError } from '@/lib/read-json-limited';

export const runtime = 'nodejs';

type CapturePayload = { title?: unknown; content?: unknown; pageTitle?: unknown; pageUrl?: unknown; selection?: unknown; folderId?: unknown; tags?: unknown; isPinned?: unknown };

function cors(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
    'Cache-Control': 'no-store, max-age=0',
  };
}

function authorizedExtension(request: NextRequest) {
  const extensionId = extensionIdFromOrigin(request.headers.get('origin'));
  if (!extensionId) return null;
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1] || null;
  const session = verifyNotesExtensionToken(token, extensionId);
  return session ? { extensionId, session, origin: request.headers.get('origin')! } : null;
}

function string(value: unknown, max: number) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }

export async function OPTIONS(request: NextRequest) {
  const extensionId = extensionIdFromOrigin(request.headers.get('origin'));
  if (!extensionId) return new NextResponse(null, { status: 403 });
  return new NextResponse(null, { status: 204, headers: cors(request.headers.get('origin')!) });
}

export async function POST(request: NextRequest) {
  const auth = authorizedExtension(request);
  if (!auth) return NextResponse.json({ error: 'UNAUTHORIZED_EXTENSION' }, { status: 401 });
  try {
    const raw = await readJsonLimited(request, 110_000);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return NextResponse.json({ error: 'INVALID_REQUEST' }, { status: 400, headers: cors(auth.origin) });
    const payload = raw as CapturePayload;
    const pageUrl = string(payload.pageUrl, 2_000);
    const pageTitle = string(payload.pageTitle, 180);
    const selection = string(payload.selection, 80_000);
    const content = string(payload.content, 100_000) || [selection && `> ${selection.replace(/\n/g, '\n> ')}`, pageUrl && `[Source: ${pageTitle || pageUrl}](${pageUrl})`].filter(Boolean).join('\n\n');
    const note = await createNote(auth.session.userId, auth.session.createdBy, randomUUID(), normalizeNoteInput({
      title: string(payload.title, 180) || pageTitle || 'Browser capture',
      content,
      folderId: string(payload.folderId, 80),
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      isPinned: payload.isPinned === true,
    }));
    return NextResponse.json({ note }, { status: 201, headers: cors(auth.origin) });
  } catch (error) {
    if (error instanceof RequestBodyError) return NextResponse.json({ error: error.message }, { status: error.status, headers: cors(auth.origin) });
    console.error('[NOTES_EXTENSION_CAPTURE_FAILED]', error);
    return NextResponse.json({ error: 'NOTE_CAPTURE_FAILED' }, { status: 500, headers: cors(auth.origin) });
  }
}
