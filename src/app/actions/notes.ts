'use server';

import { randomUUID } from 'node:crypto';
import { verifyAdmin } from '@/lib/auth-checks';
import { createNote, deleteNote, normalizeNoteInput, updateNote, type NoteInput } from '@/lib/notes';

const NOTE_ID = /^[a-f0-9-]{36}$/i;

async function currentUser() {
  const auth = await verifyAdmin();
  if (!auth.authorized) throw new Error('Unauthorized.');
  return auth.user;
}

function message(error: unknown) {
  if (error instanceof Error && error.message.includes('ConditionalCheckFailed')) return 'This note no longer exists.';
  if (error instanceof Error && ['Invalid note.', 'Unauthorized.'].includes(error.message)) return error.message;
  return 'Notes request failed. Please try again.';
}

export async function createNoteAction(input: Partial<NoteInput>) {
  try {
    const user = await currentUser();
    const createdBy = user.user_metadata.user_name || user.user_metadata.full_name || user.id;
    return { data: await createNote(user.id, createdBy, randomUUID(), normalizeNoteInput(input)) } as const;
  } catch (error) { return { error: message(error) } as const; }
}

export async function updateNoteAction(noteId: string, input: Partial<NoteInput>) {
  try {
    if (!NOTE_ID.test(noteId)) throw new Error('Invalid note.');
    const user = await currentUser();
    return { data: await updateNote(user.id, noteId, normalizeNoteInput(input)) } as const;
  } catch (error) { return { error: message(error) } as const; }
}

export async function deleteNoteAction(noteId: string) {
  try {
    if (!NOTE_ID.test(noteId)) throw new Error('Invalid note.');
    const user = await currentUser();
    await deleteNote(user.id, noteId);
    return { data: true } as const;
  } catch (error) { return { error: message(error) } as const; }
}
