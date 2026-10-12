import { NextResponse } from 'next/server';
import { confirmationHash } from '@/lib/newsletter-confirmation';
import { createAdminClient } from '@/utils/supabase/admin';
import { createResendClient, ensureUnsubscribeProperty, issueUnsubscribeLink, removeUnsubscribeLink } from '@/lib/newsletter-broadcast';
import { isRateLimited } from '@/lib/api-rate-limit';

function page(message: string, token?: string) {
  return new Response(`<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width"><title>Confirm subscription | avrxt</title></head><body><main><h1>${message}</h1>${token ? `<form method="post"><input type="hidden" name="token" value="${token}"><button>Confirm subscription</button></form>` : '<a href="/">Return home</a>'}</main></body></html>`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex, nofollow' },
  });
}
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token') || '';
  return /^[A-Za-z0-9_-]{43}$/.test(token) ? page('Confirm your newsletter subscription', token) : page('This confirmation link is unavailable.');
}
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get('sec-fetch-site') === 'cross-site') return new Response('Forbidden', { status: 403 });
  if (await isRateLimited(request.headers, 'newsletter-confirm', 10, 60_000)) return new Response('Try again shortly.', { status: 429 });
  // Read a small URL-encoded form without trusting Content-Length.
  const reader = request.body?.getReader(); if (!reader) return new Response('Invalid form', { status: 400 });
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 1024) { await reader.cancel(); return new Response('Too large', { status: 413 }); } chunks.push(value); }
  const token = new URLSearchParams(Buffer.concat(chunks).toString()).get('token') || '';
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return page('This confirmation link is unavailable.');
  try {
    const supabase = createAdminClient();
    const hash = confirmationHash(token);
    const { data, error } = await supabase.from('newsletter_confirmations').select('email,audience_id,confirmed_at,expires_at').eq('token_hash', hash).maybeSingle();
    if (error) throw error;
    if (!data || new Date(data.expires_at).getTime() < Date.now()) return page('This confirmation link has expired. Please subscribe again.');
    if (data.confirmed_at) return page('Your subscription is confirmed.');
    const resend = createResendClient();
    const existing = await resend.contacts.get({ email: data.email, audienceId: data.audience_id });
    if (existing.error && !/not found|does not exist/i.test(existing.error.message)) throw existing.error;
    await ensureUnsubscribeProperty(resend);
    const link = await issueUnsubscribeLink(data.email, data.audience_id);
    const result = existing.data
      ? await resend.contacts.update({ email: data.email, audienceId: data.audience_id, unsubscribed: false, properties: { UNSUBSCRIBE_URL: link.url } })
      : await resend.contacts.create({ email: data.email, audienceId: data.audience_id, unsubscribed: false, properties: { UNSUBSCRIBE_URL: link.url } });
    if (result.error) { await removeUnsubscribeLink(link.token); throw result.error; }
    const confirmed = await supabase.from('newsletter_confirmations').update({ confirmed_at: new Date().toISOString() }).eq('token_hash', hash);
    if (confirmed.error) throw confirmed.error;
    return page('Your subscription is confirmed. Welcome to the signal.');
  } catch {
    return NextResponse.json({ error: 'Confirmation is temporarily unavailable. Please try this link again.' }, { status: 503 });
  }
}
