import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DeleteCommand, DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

export type Note = {
  userId: string;
  noteId: string;
  title: string;
  content: string;
  folderId: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  createdBy: string;
};

export type NoteInput = Pick<Note, 'title' | 'content' | 'folderId' | 'tags' | 'isPinned'>;

function tableName() {
  const table = process.env.NOTES_DYNAMODB_TABLE_NAME;
  if (!table) throw new Error('Notes are not configured. Set NOTES_DYNAMODB_TABLE_NAME.');
  return table;
}

function client() {
  const region = process.env.AWS_REGION;
  if (!region) throw new Error('Notes are not configured. Set AWS_REGION.');
  return DynamoDBDocumentClient.from(new DynamoDBClient({ region }), { marshallOptions: { removeUndefinedValues: true } });
}

function cleanText(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function cleanTags(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((tag) => cleanText(tag, 32).toLowerCase()).filter(Boolean))].slice(0, 12);
}

export function normalizeNoteInput(value: Partial<NoteInput>): NoteInput {
  return {
    title: cleanText(value.title, 180) || 'Untitled note',
    content: typeof value.content === 'string' ? value.content.slice(0, 100_000) : '',
    folderId: cleanText(value.folderId, 80),
    tags: cleanTags(value.tags),
    isPinned: value.isPinned === true,
  };
}

function isNote(value: unknown): value is Note {
  if (!value || typeof value !== 'object') return false;
  const note = value as Partial<Note>;
  return typeof note.userId === 'string' && typeof note.noteId === 'string' && typeof note.title === 'string' && typeof note.content === 'string' && typeof note.folderId === 'string' && Array.isArray(note.tags) && typeof note.createdAt === 'string' && typeof note.updatedAt === 'string' && typeof note.isPinned === 'boolean' && typeof note.createdBy === 'string';
}

export async function listNotes(userId: string) {
  const notes: Note[] = [];
  let exclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const result = await client().send(new QueryCommand({
      TableName: tableName(),
      KeyConditionExpression: '#userId = :userId',
      ExpressionAttributeNames: { '#userId': 'userId' },
      ExpressionAttributeValues: { ':userId': userId },
      ExclusiveStartKey: exclusiveStartKey,
    }));
    notes.push(...(result.Items || []).filter(isNote));
    exclusiveStartKey = result.LastEvaluatedKey;
  } while (exclusiveStartKey);
  return notes.sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || b.updatedAt.localeCompare(a.updatedAt));
}

export async function createNote(userId: string, createdBy: string, noteId: string, input: NoteInput) {
  const now = new Date().toISOString();
  const note: Note = { userId, noteId, ...normalizeNoteInput(input), createdAt: now, updatedAt: now, createdBy };
  await client().send(new PutCommand({ TableName: tableName(), Item: note, ConditionExpression: 'attribute_not_exists(#userId) AND attribute_not_exists(#noteId)', ExpressionAttributeNames: { '#userId': 'userId', '#noteId': 'noteId' } }));
  return note;
}

export async function updateNote(userId: string, noteId: string, input: NoteInput) {
  const next = normalizeNoteInput(input);
  const updatedAt = new Date().toISOString();
  const result = await client().send(new UpdateCommand({
    TableName: tableName(),
    Key: { userId, noteId },
    UpdateExpression: 'SET #title = :title, #content = :content, #folderId = :folderId, #tags = :tags, #isPinned = :isPinned, #updatedAt = :updatedAt',
    ConditionExpression: 'attribute_exists(#userId) AND attribute_exists(#noteId)',
    ExpressionAttributeNames: { '#userId': 'userId', '#noteId': 'noteId', '#title': 'title', '#content': 'content', '#folderId': 'folderId', '#tags': 'tags', '#isPinned': 'isPinned', '#updatedAt': 'updatedAt' },
    ExpressionAttributeValues: { ':title': next.title, ':content': next.content, ':folderId': next.folderId, ':tags': next.tags, ':isPinned': next.isPinned, ':updatedAt': updatedAt },
    ReturnValues: 'ALL_NEW',
  }));
  if (!isNote(result.Attributes)) throw new Error('The note could not be updated.');
  return result.Attributes;
}

export async function deleteNote(userId: string, noteId: string) {
  await client().send(new DeleteCommand({ TableName: tableName(), Key: { userId, noteId }, ConditionExpression: 'attribute_exists(#userId) AND attribute_exists(#noteId)', ExpressionAttributeNames: { '#userId': 'userId', '#noteId': 'noteId' } }));
}
