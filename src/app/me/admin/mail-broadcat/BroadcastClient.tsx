'use client';

import { useMemo, useRef, useState } from 'react';
import { AlertCircle, Check, Code2, Eye, FilePlus2, Mail, Monitor, Send, Smartphone, Sparkles, WandSparkles } from 'lucide-react';
import { createNewsletterBroadcastAction, generateNewsletterEmailAction, getNewsletterBroadcastAction, getRecentNewsletterBroadcastsAction, sendNewsletterTestAction } from '@/app/actions/mail-broadcast';

type RecentBroadcast = {
    id: string;
    name: string | null;
    subject?: string | null;
    status: string;
    created_at: string;
    sent_at: string | null;
    scheduled_at: string | null;
};

const starterHtml = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:32px 12px;font-family:Arial,sans-serif;color:#18181b"><tr><td align="center"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:18px;overflow:hidden"><tr><td style="padding:42px 36px"><p style="margin:0 0 12px;color:#71717a;font-size:12px;letter-spacing:2px;text-transform:uppercase">avrxt / dispatch</p><h1 style="margin:0 0 18px;font-size:32px;line-height:1.15">A note for you</h1><p style="margin:0 0 24px;color:#52525b;font-size:16px;line-height:1.7">Hi {{{FIRST_NAME|there}}},<br><br>Write your update here. This editor accepts email-safe HTML, inline styles, tables, links, and Resend contact variables.</p><a href="https://www.avrxt.dev" style="display:inline-block;padding:13px 20px;border-radius:10px;background:#111;color:#fff;text-decoration:none;font-weight:700">Explore avrxt.dev</a></td></tr></table></td></tr></table>`;

const templates = {
    'Clean note': starterHtml,
    'Product update': `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:32px 12px;font-family:Arial,sans-serif;color:#18181b"><tr><td align="center"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff"><tr><td style="padding:18px 30px;border-bottom:1px solid #e4e4e7;font-size:12px;letter-spacing:2px">AVRXT / PRODUCT NOTES</td></tr><tr><td style="padding:42px 30px"><h1 style="font-size:30px">What's new</h1><p style="line-height:1.7;color:#52525b">Hi {{{FIRST_NAME|there}}},<br><br>Share what changed, why it matters, and where to learn more.</p><p><a href="https://www.avrxt.dev" style="color:#18181b">Read the update →</a></p></td></tr></table></td></tr></table>`,
    'Plain text style': `<div style="max-width:620px;margin:0 auto;padding:36px 20px;font-family:Arial,sans-serif;color:#27272a;font-size:16px;line-height:1.8"><p>Hi {{{FIRST_NAME|there}}},</p><p>Your message goes here. Keep this layout simple for a personal note.</p><p>— avrxt</p></div>`,
};

function withPreviewFooter(html: string) {
    let content = html.replace(/<!--\s*avrxt-unsubscribe-footer\s*-->[\s\S]*?<\/div\s*>/gi, '');
    content = content.replace(/<a\b[^>]*href=["']\{\{\{RESEND_UNSUBSCRIBE_URL\}\}\}["'][^>]*>[\s\S]*?<\/a\s*>/gi, '');
    content = content.replace(/\{\{\{RESEND_UNSUBSCRIBE_URL\}\}\}/g, '');
    if (content.includes('{{{UNSUBSCRIBE_URL}}}')) return content;
    const footer = `<!-- avrxt-unsubscribe-footer --><div style="margin:32px auto 0;padding:20px 12px;border-top:1px solid #e5e7eb;text-align:center;font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:#6b7280">You are receiving this email because you subscribed to avrxt updates.<br><a href="{{{UNSUBSCRIBE_URL}}}" style="color:#4b5563;text-decoration:underline">Unsubscribe from avrxt emails</a></div>`;
    if (/<\/body\s*>/i.test(content)) return content.replace(/<\/body\s*>/i, `${footer}</body>`);
    if (/<\/html\s*>/i.test(content)) return content.replace(/<\/html\s*>/i, `${footer}</html>`);
    return `${content}\n${footer}`;
}

function formatDate(value: string | null) {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function createRequestKey() {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    return Array.from(crypto.getRandomValues(new Uint8Array(16)), value => value.toString(16).padStart(2, '0')).join('');
}

export default function BroadcastClient({ initialBroadcasts, defaultFrom }: { initialBroadcasts: RecentBroadcast[]; defaultFrom: string }) {
    const [name, setName] = useState('avrxt update');
    const [from, setFrom] = useState(defaultFrom);
    const [replyTo, setReplyTo] = useState('');
    const [subject, setSubject] = useState('A note from avrxt');
    const [previewText, setPreviewText] = useState('A short preview shown in the inbox.');
    const [html, setHtml] = useState(starterHtml);
    const [testTo, setTestTo] = useState('');
    const [scheduleLocal, setScheduleLocal] = useState('');
    const [status, setStatus] = useState('');
    const [busy, setBusy] = useState(false);
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
    const [broadcasts, setBroadcasts] = useState(initialBroadcasts);
    const [editingId, setEditingId] = useState('');
    const [aiPrompt, setAiPrompt] = useState('');
    const htmlRef = useRef<HTMLTextAreaElement>(null);

    const previewHtml = useMemo(() => withPreviewFooter(html)
        .replace(/\{\{\{FIRST_NAME\|there\}\}\}/g, 'there')
        .replace(/\{\{\{FIRST_NAME\}\}\}/g, 'Alex')
        .replace(/\{\{\{LAST_NAME\}\}\}/g, 'Reader')
        .replace(/\{\{\{EMAIL\}\}\}/g, 'reader@example.com')
        .replace(/\{\{\{UNSUBSCRIBE_URL\}\}\}/g, 'https://unsub.avrxt.dev/mail/example-key'), [html]);

    const insertHtml = (snippet: string) => {
        const input = htmlRef.current;
        if (!input) {
            setHtml(current => `${current}\n${snippet}`);
            return;
        }
        const start = input.selectionStart;
        const end = input.selectionEnd;
        setHtml(current => `${current.slice(0, start)}${snippet}${current.slice(end)}`);
        requestAnimationFrame(() => {
            input.focus();
            input.setSelectionRange(start + snippet.length, start + snippet.length);
        });
    };

    const saveOrSend = async (mode: 'draft' | 'send' | 'schedule') => {
        if (mode !== 'draft') {
            const planned = mode === 'schedule' ? ` for ${new Date(scheduleLocal).toLocaleString()}` : ' now';
            if (!confirm(`Send “${subject}” to the active Resend newsletter audience${planned}?`)) return;
        }
        setBusy(true);
        setStatus(mode === 'draft' ? 'Saving draft…' : 'Preparing audience and submitting to Resend…');
        try {
            const result = await createNewsletterBroadcastAction({
                name, from, replyTo, subject, previewText, html, mode,
                ...(mode === 'schedule' ? { scheduledAt: new Date(scheduleLocal).toISOString() } : {}),
                idempotencyKey: createRequestKey(),
                ...(editingId ? { existingId: editingId } : {}),
            });
            if ('error' in result) {
                setStatus(`ERROR: ${result.error}`);
            } else {
                setStatus(mode === 'draft'
                    ? `Draft saved · ${result.id || 'Resend'}`
                    : mode === 'schedule'
                        ? `Broadcast scheduled · ${result.recipientCount || 0} active contacts · ${result.id || ''}`
                        : `Broadcast sent to Resend · ${result.recipientCount || 0} active contacts · ${result.id || ''}`);
                if (mode === 'draft' && result.id) setEditingId(result.id);
                else setEditingId('');
                const latest = await getRecentNewsletterBroadcastsAction();
                if ('broadcasts' in latest) setBroadcasts(latest.broadcasts as RecentBroadcast[]);
            }
        } catch (error) {
            setStatus(`ERROR: ${error instanceof Error ? error.message : 'Request failed.'}`);
        } finally {
            setBusy(false);
        }
    };

    const openDraft = async (id: string) => {
        setBusy(true);
        setStatus('Loading draft…');
        try {
            const result = await getNewsletterBroadcastAction(id);
            if ('error' in result) {
                setStatus(`ERROR: ${result.error}`);
            } else {
                setEditingId(result.broadcast.id);
                setName(result.broadcast.name);
                setFrom(result.broadcast.from || defaultFrom);
                setReplyTo(result.broadcast.replyTo);
                setSubject(result.broadcast.subject);
                setPreviewText(result.broadcast.previewText);
                setHtml(result.broadcast.html);
                setStatus(`Editing draft · ${result.broadcast.id}`);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (error) {
            setStatus(`ERROR: ${error instanceof Error ? error.message : 'Could not load draft.'}`);
        } finally {
            setBusy(false);
        }
    };

    const sendTest = async () => {
        setBusy(true);
        setStatus('Sending test message…');
        try {
            const result = await sendNewsletterTestAction({ from, to: testTo, subject, html });
            setStatus('error' in result ? `ERROR: ${result.error}` : `Test email sent to ${testTo}.`);
        } catch (error) {
            setStatus(`ERROR: ${error instanceof Error ? error.message : 'Test request failed.'}`);
        } finally {
            setBusy(false);
        }
    };

    const generateWithAi = async () => {
        setBusy(true);
        setStatus('Generating an email draft…');
        try {
            const result = await generateNewsletterEmailAction({ prompt: aiPrompt });
            if ('error' in result) {
                setStatus(`ERROR: ${result.error}`);
            } else {
                setSubject(result.draft.subject);
                setPreviewText(result.draft.previewText);
                setHtml(result.draft.html);
                setStatus('AI draft ready. Review the subject and preview, then edit or send when you are satisfied.');
                setAiPrompt('');
            }
        } catch (error) {
            setStatus(`ERROR: ${error instanceof Error ? error.message : 'Could not generate an email.'}`);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.28em] text-zinc-500"><Sparkles size={13} /> Resend / Campaign Studio</div>
                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Mail broadcast</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Compose responsive HTML, preview it, test it, then save a draft or send to active subscribers.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => saveOrSend('draft')} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 px-4 text-xs font-medium text-zinc-200 transition hover:bg-white/5 disabled:opacity-50"><FilePlus2 size={15} /> {editingId ? 'Update draft' : 'Save draft'}</button>
                    <button type="button" onClick={() => saveOrSend('send')} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-xs font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"><Send size={15} /> Send broadcast</button>
                </div>
            </header>

            {status && <div role="status" aria-live="polite" className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${status.startsWith('ERROR') ? 'border-red-500/20 bg-red-500/5 text-red-300' : 'border-white/10 bg-white/[0.03] text-zinc-300'}`}>{status.startsWith('ERROR') ? <AlertCircle size={15} className="mt-0.5 shrink-0" /> : <Check size={15} className="mt-0.5 shrink-0" />}<span>{status}</span></div>}

            <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.015] p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><WandSparkles size={16} className="text-zinc-300" /> AI email draft <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-zinc-500">Workers AI · free tier</span></div>
                <p className="mb-3 text-xs leading-5 text-zinc-400">Describe the audience, goal, tone, and any exact details or links. AI fills the subject, inbox preview, and responsive HTML for you to review.</p>
                <label htmlFor="mail-ai-prompt" className="sr-only">Describe the email you want</label>
                <textarea id="mail-ai-prompt" value={aiPrompt} onChange={event => setAiPrompt(event.target.value)} maxLength={2000} rows={3} placeholder="Example: Write a concise launch email announcing our updated visual gallery. Keep it calm and monochrome, explain what changed, and include a button linking to https://www.avrxt.dev/me." className="mail-field min-h-24 resize-y !text-sm !leading-6" />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className="text-[10px] text-zinc-500">Do not include secrets or subscriber personal information.</span><button type="button" onClick={generateWithAi} disabled={busy || aiPrompt.trim().length < 8} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-4 text-xs font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"><WandSparkles size={14} /> {busy ? 'Generating…' : 'Generate draft'}</button></div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
                <div className="space-y-5">
                    <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:grid-cols-2 sm:p-5">
                        <label className="space-y-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500">Campaign name<input value={name} onChange={event => setName(event.target.value)} maxLength={120} className="mail-field" placeholder="Campaign name" /></label>
                        <label className="space-y-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500">From address<input value={from} onChange={event => setFrom(event.target.value)} className="mail-field" placeholder="avrxt Updates <news@avrxt.dev>" /></label>
                        <label className="space-y-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500">Reply-to<input value={replyTo} onChange={event => setReplyTo(event.target.value)} className="mail-field" placeholder="hello@avrxt.dev" /></label>
                        <label className="space-y-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500">Subject<input value={subject} onChange={event => setSubject(event.target.value)} maxLength={200} className="mail-field" placeholder="Email subject" /></label>
                        <label className="space-y-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500 sm:col-span-2">Inbox preview text<input value={previewText} onChange={event => setPreviewText(event.target.value)} maxLength={240} className="mail-field" placeholder="Short inbox snippet" /></label>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d]">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-3">
                            <div className="flex items-center gap-2 text-xs font-semibold"><Code2 size={15} className="text-zinc-400" /> HTML source</div>
                            <select aria-label="Email starter template" onChange={event => setHtml(templates[event.target.value as keyof typeof templates])} className="rounded-lg border border-white/10 bg-black px-3 py-2 text-xs text-zinc-300"><option>Clean note</option><option>Product update</option><option>Plain text style</option></select>
                        </div>
                        <div className="flex flex-wrap gap-2 border-b border-white/10 p-3">
                            <button type="button" onClick={() => insertHtml('<h2 style="font-size:24px;line-height:1.25;margin:20px 0">Heading</h2>')} className="mail-tool">Heading</button>
                            <button type="button" onClick={() => insertHtml('<p style="font-size:16px;line-height:1.7;margin:0 0 18px">Paragraph text</p>')} className="mail-tool">Paragraph</button>
                            <button type="button" onClick={() => insertHtml('<a href="https://www.avrxt.dev" style="display:inline-block;padding:12px 18px;background:#111;color:#fff;text-decoration:none;border-radius:8px">Button label</a>')} className="mail-tool">Button</button>
                            <button type="button" onClick={() => insertHtml('<img src="https://" alt="" width="560" style="display:block;width:100%;max-width:560px;height:auto;border:0">')} className="mail-tool">Image</button>
                            <button type="button" onClick={() => insertHtml('<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:12px">Column one</td><td style="padding:12px">Column two</td></tr></table>')} className="mail-tool">2 columns</button>
                            <button type="button" onClick={() => insertHtml('{{{FIRST_NAME|there}}}')} className="mail-tool">First name</button>
                            <button type="button" onClick={() => insertHtml('{{{LAST_NAME}}}')} className="mail-tool">Last name</button>
                            <button type="button" onClick={() => insertHtml('{{{EMAIL}}}')} className="mail-tool">Email</button>
                        </div>
                        <textarea ref={htmlRef} value={html} onChange={event => setHtml(event.target.value)} spellCheck={false} aria-label="Email HTML source" className="min-h-[540px] w-full resize-y bg-[#090909] p-4 font-mono text-xs leading-6 text-zinc-300 outline-none focus:ring-1 focus:ring-inset focus:ring-white/20 sm:p-5" />
                        <div className="flex flex-col gap-3 border-t border-white/10 p-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 flex-1 items-center gap-2"><input type="email" value={testTo} onChange={event => setTestTo(event.target.value)} placeholder="test recipient email" className="mail-field !min-h-10" /><button type="button" onClick={sendTest} disabled={busy || !testTo} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs text-zinc-200 hover:bg-white/5 disabled:opacity-40"><Mail size={14} /> Send test</button></div>
                            <div className="flex gap-2"><input type="datetime-local" value={scheduleLocal} onChange={event => setScheduleLocal(event.target.value)} aria-label="Schedule broadcast date and time" className="mail-field !min-h-10 min-w-0 sm:w-auto" /><button type="button" onClick={() => saveOrSend('schedule')} disabled={busy || !scheduleLocal} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs text-zinc-200 hover:bg-white/5 disabled:opacity-40">Schedule</button></div>
                        </div>
                    </div>
                </div>

                <aside className="space-y-5">
                    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4">
                            <div><div className="flex items-center gap-2 text-sm font-semibold"><Eye size={15} /> Inbox preview</div><p className="mt-1 text-[11px] text-zinc-500">Personalization and unsubscribe footer are shown with sample values.</p></div>
                            <div className="flex rounded-lg border border-white/10 p-1"><button type="button" onClick={() => setPreviewMode('desktop')} aria-label="Desktop preview" className={`rounded-md p-2 ${previewMode === 'desktop' ? 'bg-white/10 text-white' : 'text-zinc-500'}`}><Monitor size={14} /></button><button type="button" onClick={() => setPreviewMode('mobile')} aria-label="Mobile preview" className={`rounded-md p-2 ${previewMode === 'mobile' ? 'bg-white/10 text-white' : 'text-zinc-500'}`}><Smartphone size={14} /></button></div>
                        </div>
                        <div className="min-h-[620px] overflow-auto bg-[#e4e4e7] p-3 sm:p-6">
                            <div className="mx-auto mb-3 max-w-[640px] rounded-lg bg-white px-4 py-3 text-xs text-zinc-600 shadow-sm"><div className="font-semibold text-zinc-800">{from || 'From address'}</div><div className="mt-1 truncate text-sm font-semibold text-zinc-900">{subject || 'Subject line'}</div><div className="mt-1 truncate text-zinc-500">{previewText || 'Inbox preview text'}</div></div>
                            <iframe title="Rendered email preview" sandbox="" srcDoc={`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:12px;background:#fff;overflow-wrap:anywhere}img{max-width:100%;height:auto}table{max-width:100%}*{box-sizing:border-box}</style></head><body>${previewHtml}</body></html>`} className={`mx-auto min-h-[500px] border-0 bg-white shadow-sm transition-[width] ${previewMode === 'mobile' ? 'w-[375px] max-w-full' : 'w-full max-w-[640px]'}`} />
                        </div>
                        <div className="flex items-center gap-2 border-t border-white/10 px-4 py-3 text-[10px] leading-5 text-zinc-500"><WandSparkles size={13} className="shrink-0" /> Every draft and send gets an unsubscribe footer. Sends use Resend Broadcasts and skip unsubscribed contacts.</div>
                    </section>
                    <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
                        <div className="mb-4 flex items-center justify-between"><div><h2 className="text-sm font-semibold">Recent broadcasts</h2><p className="mt-1 text-[11px] text-zinc-500">Latest campaigns from Resend.</p></div><button type="button" onClick={async () => { const result = await getRecentNewsletterBroadcastsAction(); if ('broadcasts' in result) setBroadcasts(result.broadcasts as RecentBroadcast[]); }} className="text-[10px] text-zinc-400 hover:text-white">Refresh</button></div>
                        <div className="space-y-2">{broadcasts.length ? broadcasts.map(item => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-3"><button type="button" onClick={() => item.status === 'draft' && openDraft(item.id)} disabled={busy || item.status !== 'draft'} className="min-w-0 text-left disabled:cursor-default"><div className="truncate text-xs font-medium text-zinc-200">{item.name || item.id}</div><div className="mt-1 text-[10px] text-zinc-500">{formatDate(item.sent_at || item.scheduled_at || item.created_at)}{item.status === 'draft' ? ' · Open draft' : ''}</div></button><span className="rounded-full border border-white/10 px-2 py-1 text-[9px] uppercase tracking-wider text-zinc-400">{item.status}</span></div>) : <p className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-xs text-zinc-500">No campaigns yet.</p>}</div>
                    </section>
                </aside>
            </section>

            <style jsx global>{`.mail-field{display:block;width:100%;min-height:44px;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:#080808;padding:10px 12px;font-size:12px;letter-spacing:normal;text-transform:none;color:#f4f4f5;outline:none}.mail-field:focus{border-color:rgba(255,255,255,.35)}.mail-tool{border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:7px 10px;color:#a1a1aa;font-size:10px;transition:all .2s}.mail-tool:hover{background:rgba(255,255,255,.07);color:#fff}`}</style>
        </div>
    );
}
