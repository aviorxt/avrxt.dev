'use client';

import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Archive, Bold, Check, ChevronDown, Code2, FilePlus2, Folder, Hash, List, LoaderCircle, Pin, Search, Trash2, Undo2 } from 'lucide-react';
import { createNoteAction, deleteNoteAction, updateNoteAction } from '@/app/actions/notes';
import type { Note, NoteInput } from '@/lib/notes';
import { cn } from '@/lib/utils';

type Mode = 'edit' | 'preview';
const blank = (): NoteInput => ({ title: 'Untitled note', content: '', folderId: '', tags: [], isPinned: false });

function noteDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Just now' : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' }).format(date);
}

function ToolbarButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" title={label} aria-label={label} onClick={onClick} className="grid size-9 place-items-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-white">{children}</button>;
}

export default function NotesClient({ initialNotes }: { initialNotes: Note[] }) {
  const [notes, setNotes] = useState(initialNotes);
  const [selectedId, setSelectedId] = useState(initialNotes[0]?.noteId || '');
  const [draft, setDraft] = useState<NoteInput>(() => initialNotes[0] ? { title: initialNotes[0].title, content: initialNotes[0].content, folderId: initialNotes[0].folderId, tags: initialNotes[0].tags, isPinned: initialNotes[0].isPinned } : blank());
  const [mode, setMode] = useState<Mode>('edit');
  const [query, setQuery] = useState('');
  const [folder, setFolder] = useState('all');
  const [tagText, setTagText] = useState('');
  const [busy, setBusy] = useState<'save' | 'delete' | 'new' | null>(null);
  const [status, setStatus] = useState('');

  const selected = notes.find((note) => note.noteId === selectedId) || null;
  const folders = useMemo(() => [...new Set(notes.map((note) => note.folderId).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [notes]);
  const filtered = useMemo(() => notes.filter((note) => {
    const haystack = `${note.title} ${note.content} ${note.tags.join(' ')}`.toLowerCase();
    return (folder === 'all' || (folder === 'pinned' ? note.isPinned : note.folderId === folder)) && haystack.includes(query.trim().toLowerCase());
  }).sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || b.updatedAt.localeCompare(a.updatedAt)), [notes, folder, query]);

  const select = (note: Note) => {
    setSelectedId(note.noteId);
    setDraft({ title: note.title, content: note.content, folderId: note.folderId, tags: note.tags, isPinned: note.isPinned });
    setStatus('');
  };

  const addTag = () => {
    const value = tagText.trim().replace(/^#/, '').toLowerCase();
    if (!value || draft.tags.includes(value)) return;
    setDraft((current) => ({ ...current, tags: [...current.tags, value].slice(0, 12) }));
    setTagText('');
  };

  const insert = (before: string, after = '') => {
    const textarea = document.getElementById('note-content') as HTMLTextAreaElement | null;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = draft.content.slice(start, end) || 'text';
    const next = `${draft.content.slice(0, start)}${before}${selectedText}${after}${draft.content.slice(end)}`;
    setDraft((current) => ({ ...current, content: next }));
    requestAnimationFrame(() => { textarea.focus(); textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length); });
  };

  const create = async () => {
    setBusy('new'); setStatus('');
    const result = await createNoteAction(blank());
    setBusy(null);
    if ('error' in result) { setStatus(result.error || 'Could not create note.'); return; }
    setNotes((current) => [result.data, ...current]);
    select(result.data);
    setMode('edit');
  };

  const save = async () => {
    if (!selected) return void create();
    setBusy('save'); setStatus('');
    const result = await updateNoteAction(selected.noteId, draft);
    setBusy(null);
    if ('error' in result) { setStatus(result.error || 'Could not save note.'); return; }
    setNotes((current) => current.map((note) => note.noteId === result.data.noteId ? result.data : note));
    setDraft({ title: result.data.title, content: result.data.content, folderId: result.data.folderId, tags: result.data.tags, isPinned: result.data.isPinned });
    setStatus('Saved');
  };

  const remove = async () => {
    if (!selected || !window.confirm(`Delete “${selected.title}”? This cannot be undone.`)) return;
    setBusy('delete'); setStatus('');
    const result = await deleteNoteAction(selected.noteId);
    setBusy(null);
    if ('error' in result) { setStatus(result.error || 'Could not delete note.'); return; }
    const remaining = notes.filter((note) => note.noteId !== selected.noteId);
    setNotes(remaining);
    if (remaining[0]) select(remaining[0]); else { setSelectedId(''); setDraft(blank()); }
  };

  return <main className="min-h-[calc(100svh-3rem)] bg-[#050505] px-4 py-6 text-zinc-100 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
    <div className="mx-auto w-full max-w-7xl">
      <header className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-6 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-zinc-500">Workspace / private knowledge</p><h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Notes</h1><p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">A private Markdown workspace, protected by your Discord admin session.</p></div>
        <button type="button" onClick={() => void create()} disabled={busy !== null} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-60"><FilePlus2 size={16} />New note</button>
      </header>

      <div className="grid min-h-[min(720px,calc(100svh-13rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col border-b border-white/10 bg-[#0d0d0d] lg:border-b-0 lg:border-r">
          <div className="border-b border-white/10 p-3"><label className="flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-black px-3 text-zinc-500 focus-within:border-white/30"><Search size={14}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notes" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600" /></label></div>
          <div className="flex gap-1 overflow-x-auto border-b border-white/10 p-2 lg:block lg:space-y-1">
            {[['all', 'All notes'], ['pinned', 'Pinned']].map(([id, label]) => <button key={id} type="button" onClick={() => setFolder(id)} className={cn('inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-xs transition lg:flex lg:w-full', folder === id ? 'bg-white/[.09] text-white' : 'text-zinc-500 hover:bg-white/[.05] hover:text-zinc-300')}>{id === 'pinned' ? <Pin size={13}/> : <Archive size={13}/>} {label}</button>)}
            {folders.map((name) => <button key={name} type="button" onClick={() => setFolder(name)} className={cn('inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-xs transition lg:flex lg:w-full', folder === name ? 'bg-white/[.09] text-white' : 'text-zinc-500 hover:bg-white/[.05] hover:text-zinc-300')}><Folder size={13}/><span className="truncate">{name}</span></button>)}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {filtered.length ? filtered.map((note) => <button type="button" key={note.noteId} onClick={() => select(note)} className={cn('mb-1 w-full rounded-xl p-3 text-left transition', note.noteId === selectedId ? 'bg-white/[.1] ring-1 ring-white/10' : 'hover:bg-white/[.05]')}><div className="flex items-start gap-2"><span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-100">{note.title}</span>{note.isPinned && <Pin size={13} className="mt-0.5 shrink-0 text-amber-300" fill="currentColor"/>}</div><p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">{note.content || 'Empty note'}</p><div className="mt-2 flex items-center gap-2"><span className="text-[10px] text-zinc-600">{noteDate(note.updatedAt)}</span>{note.tags.slice(0, 2).map((tag) => <span key={tag} className="font-mono text-[9px] text-zinc-500">#{tag}</span>)}</div></button>) : <div className="grid min-h-32 place-items-center px-5 text-center text-xs leading-5 text-zinc-600">No notes found.</div>}
          </div>
        </aside>

        <section className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5"><div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black p-1"><button type="button" onClick={() => setMode('edit')} className={cn('rounded-md px-3 py-1.5 text-xs', mode === 'edit' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white')}>Edit</button><button type="button" onClick={() => setMode('preview')} className={cn('rounded-md px-3 py-1.5 text-xs', mode === 'preview' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white')}>Preview</button></div><div className="flex items-center gap-1"><span aria-live="polite" className="mr-2 text-xs text-zinc-500">{status}</span><button type="button" onClick={() => void remove()} disabled={!selected || busy !== null} className="grid size-9 place-items-center rounded-lg text-zinc-500 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-30" aria-label="Delete note"><Trash2 size={16}/></button><button type="button" onClick={() => void save()} disabled={busy !== null} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-white px-3 text-xs font-semibold text-black hover:bg-zinc-200 disabled:opacity-60">{busy === 'save' ? <LoaderCircle size={14} className="animate-spin"/> : <Check size={14}/>}Save</button></div></div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            {mode === 'edit' ? <div className="mx-auto w-full max-w-4xl space-y-5"><input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Untitled note" className="w-full bg-transparent text-2xl font-bold tracking-tight text-white outline-none placeholder:text-zinc-600 sm:text-3xl" /><div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]"><label className="relative"><span className="sr-only">Folder</span><Folder size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/><input list="note-folders" value={draft.folderId} onChange={(event) => setDraft((current) => ({ ...current, folderId: event.target.value }))} placeholder="Folder (optional)" className="h-11 w-full rounded-xl border border-white/10 bg-black pl-9 pr-3 text-sm outline-none focus:border-white/30"/><datalist id="note-folders">{folders.map((name) => <option key={name} value={name}/>)}</datalist></label><button type="button" onClick={() => setDraft((current) => ({ ...current, isPinned: !current.isPinned }))} className={cn('inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-3 text-sm transition', draft.isPinned ? 'border-amber-300/30 bg-amber-300/10 text-amber-200' : 'border-white/10 bg-black text-zinc-400 hover:text-white')}><Pin size={14} fill={draft.isPinned ? 'currentColor' : 'none'}/>{draft.isPinned ? 'Pinned' : 'Pin note'}</button></div><div className="flex flex-wrap items-center gap-2">{draft.tags.map((tag) => <button key={tag} type="button" onClick={() => setDraft((current) => ({ ...current, tags: current.tags.filter((item) => item !== tag) }))} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1 font-mono text-[10px] text-zinc-300 hover:border-red-300/30 hover:text-red-200"><Hash size={10}/>{tag} ×</button>)}<div className="flex items-center"><input value={tagText} onChange={(event) => setTagText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addTag(); } }} placeholder="Add tag" className="h-8 w-24 bg-transparent px-2 text-xs outline-none placeholder:text-zinc-600"/><button type="button" onClick={addTag} className="text-xs text-zinc-400 hover:text-white">Add</button></div></div><div className="overflow-hidden rounded-xl border border-white/10 bg-black"><div className="flex items-center gap-1 border-b border-white/10 p-1"><ToolbarButton label="Bold" onClick={() => insert('**', '**')}><Bold size={15}/></ToolbarButton><ToolbarButton label="Code" onClick={() => insert('`', '`')}><Code2 size={15}/></ToolbarButton><ToolbarButton label="List" onClick={() => insert('- ')}><List size={15}/></ToolbarButton><span className="ml-auto px-2 font-mono text-[9px] uppercase tracking-[.14em] text-zinc-600">Markdown supported</span></div><textarea id="note-content" value={draft.content} onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))} placeholder="Start writing…\n\nUse Markdown: **bold**, # heading, - list, [link](https://example.com)" className="min-h-[23rem] w-full resize-y bg-transparent p-4 font-mono text-sm leading-7 text-zinc-200 outline-none placeholder:text-zinc-700" /></div></div> : <article className="notes-markdown mx-auto w-full max-w-4xl"><h1>{draft.title || 'Untitled note'}</h1>{draft.content ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft.content}</ReactMarkdown> : <p className="text-zinc-500">Nothing written yet.</p>}</article>}
          </div>
        </section>
      </div>
    </div>
    <style jsx global>{`.notes-markdown{color:#d4d4d8;font-size:.95rem;line-height:1.8}.notes-markdown h1,.notes-markdown h2,.notes-markdown h3{color:#fff;font-weight:700;line-height:1.25;margin:1.5em 0 .55em}.notes-markdown h1{font-size:2rem;margin-top:0}.notes-markdown h2{font-size:1.45rem}.notes-markdown h3{font-size:1.15rem}.notes-markdown p,.notes-markdown ul,.notes-markdown ol,.notes-markdown pre,.notes-markdown blockquote{margin:.9rem 0}.notes-markdown ul,.notes-markdown ol{padding-left:1.5rem}.notes-markdown a{color:#93c5fd;text-decoration:underline}.notes-markdown code{border-radius:.35rem;background:#18181b;padding:.12rem .3rem;font-size:.85em}.notes-markdown pre{overflow:auto;border:1px solid #27272a;border-radius:.75rem;background:#09090b;padding:1rem}.notes-markdown pre code{padding:0;background:transparent}.notes-markdown blockquote{border-left:2px solid #52525b;padding-left:1rem;color:#a1a1aa}.notes-markdown table{width:100%;border-collapse:collapse}.notes-markdown th,.notes-markdown td{border:1px solid #3f3f46;padding:.5rem;text-align:left}`}</style>
  </main>;
}
