export const UNSUBSCRIBE_PATH = '/preferance/mail/unsub';
export const TEST_UNSUBSCRIBE_AUDIENCE = '__avrxt_test__';
export const validUnsubscribeToken = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{40,60}$/.test(value);
export function makeUnsubscribeUrl(token: string) {
  if (!validUnsubscribeToken(token)) throw new Error('Invalid unsubscribe token');
  // Canonical site route; an obsolete Worker-origin environment value must
  // never put new emails back onto the retired processing service.
  return `https://www.avrxt.dev${UNSUBSCRIBE_PATH}/${encodeURIComponent(token)}`;
}
export type UnsubscribeRecord = { email: string; audience_id: string; unsubscribed_at: string | null };
export type PreferenceResult = { state: 'ready' | 'unavailable' | 'unsubscribed' | 'test_confirmed'; isTest?: boolean };
export type UnsubscribeDependencies = {
  find: (token: string) => Promise<UnsubscribeRecord | null>;
  stopNewsletter: (record: UnsubscribeRecord) => Promise<void>;
  markComplete: (record: UnsubscribeRecord) => Promise<void>;
};
export function preferenceState(record: UnsubscribeRecord | null): PreferenceResult {
  if (!record) return { state: 'unavailable' };
  const isTest = record.audience_id === TEST_UNSUBSCRIBE_AUDIENCE;
  return { state: record.unsubscribed_at ? isTest ? 'test_confirmed' : 'unsubscribed' : 'ready', isTest };
}
export async function unsubscribeOnce(token: string, dependencies: UnsubscribeDependencies): Promise<PreferenceResult> {
  if (!validUnsubscribeToken(token)) return { state: 'unavailable' };
  const record = await dependencies.find(token);
  const current = preferenceState(record);
  if (!record || current.state !== 'ready') return current;
  if (!current.isTest) await dependencies.stopNewsletter(record);
  // Never mark success in the database before Resend accepts the opt-out.
  await dependencies.markComplete(record);
  return { state: current.isTest ? 'test_confirmed' : 'unsubscribed', isTest: current.isTest };
}
