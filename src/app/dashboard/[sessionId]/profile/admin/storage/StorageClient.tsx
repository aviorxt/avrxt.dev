'use client';

import { ChangeEvent, DragEvent, FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronDown, ChevronRight, Copy, Download, File, Folder, FolderPlus, Globe2, Link2, LoaderCircle, LockKeyhole, MoreHorizontal, Pause, Pencil, Play, RefreshCw, Share2, Trash2, Upload, Volume2, VolumeX, X } from 'lucide-react';
import { copyStorageAction, createFolderAction, createStorageShareAction, deleteStorageAction, getStorageUploadAction, listStorageAction, moveStorageAction, previewStorageAction, setStorageVisibilityAction } from '@/app/actions/storage';
import type { StorageEntry } from '@/lib/s3-storage';
import { ScrollArea } from '@/components/ui/scroll-area';

const size = (n = 0) => n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`;
const mediaTime = (value = 0) => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
type Modal = { kind: 'folder'; value: string } | { kind: 'rename' | 'copy'; entry: StorageEntry; value: string } | { kind: 'delete'; entry: StorageEntry };
type Preview = { key: string; name: string; url: string; type: string };

function MediaPreview({ preview, onClose }: { preview: Preview; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const isVideo = preview.type.startsWith('video/');
  const isAudio = preview.type.startsWith('audio/');
  const currentMedia = () => isVideo ? video.current : audio.current;
  const toggle = async () => {
    const target = currentMedia();
    if (!target) return;
    if (target.paused) { await target.play(); } else target.pause();
  };
  const seek = (value: number) => { const target = currentMedia(); if (target) target.currentTime = value; };
  const toggleMute = () => { const target = currentMedia(); if (target) target.muted = !target.muted; };
  const onLoaded = () => setDuration(currentMedia()?.duration || 0);
  const player = isVideo || isAudio;

  return <div className="fixed inset-0 z-[70] grid place-items-center bg-black/85 p-2 backdrop-blur-sm sm:p-6" role="presentation">
    <section role="dialog" aria-modal="true" aria-label={`Preview ${preview.name}`} className="max-h-[calc(100dvh-1rem)] w-full max-w-5xl overflow-y-auto border border-white/15 bg-[#090909] shadow-2xl shadow-black/80">
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="min-w-0"><p className="font-mono text-[9px] uppercase tracking-[.18em] text-zinc-500">Private preview</p><h2 className="truncate text-sm font-medium text-white">{preview.name}</h2></div>
        <div className="flex shrink-0 gap-1"><a href={preview.url} download={preview.name} className="grid size-9 place-items-center border border-white/10 text-zinc-300 hover:bg-white/10" aria-label="Download file"><Download size={15}/></a><button onClick={onClose} className="grid size-9 place-items-center border border-white/10 text-zinc-300 hover:bg-white/10" aria-label="Close preview"><X size={16}/></button></div>
      </header>
      <div className="bg-black p-3 sm:p-5">
        {preview.type.startsWith('image/') && <img src={preview.url} alt={preview.name} className="mx-auto max-h-[62svh] max-w-full object-contain" />}
        {isVideo && <video ref={video} src={preview.url} muted={muted} playsInline onLoadedMetadata={onLoaded} onTimeUpdate={() => setElapsed(video.current?.currentTime || 0)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} className="mx-auto max-h-[58svh] w-full bg-black object-contain" onClick={() => void toggle()} />}
        {isAudio && <div className="grid min-h-52 place-items-center bg-[radial-gradient(circle_at_center,rgba(255,255,255,.1),transparent_48%)]"><div className="grid size-24 place-items-center border border-white/15 bg-white/[.05]"><Volume2 size={32} /></div></div>}
        {isAudio && <audio ref={audio} src={preview.url} muted={muted} onLoadedMetadata={onLoaded} onTimeUpdate={() => setElapsed(audio.current?.currentTime || 0)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />}
        {preview.type === 'application/pdf' && <iframe title={preview.name} src={preview.url} className="h-[62svh] w-full bg-white" />}
        {!player && !preview.type.startsWith('image/') && preview.type !== 'application/pdf' && <div className="grid min-h-56 place-items-center border border-dashed border-white/15 p-8 text-center"><File size={28} className="text-zinc-500"/><p className="mt-4 text-sm text-zinc-400">A browser preview is not available for this file type.</p><a href={preview.url} download={preview.name} className="mt-5 inline-flex items-center gap-2 bg-white px-4 py-2 text-xs font-bold text-black"><Download size={14}/> Download file</a></div>}
      </div>
      {player && <div className="border-t border-white/10 bg-[#0d0d0d] p-3 sm:px-5 sm:py-4"><div className="grid grid-cols-[2.5rem_minmax(0,1fr)_2.25rem] items-center gap-2 sm:flex sm:gap-3"><button onClick={() => void toggle()} className="grid size-10 shrink-0 place-items-center bg-white text-black" aria-label={playing ? 'Pause' : 'Play'}>{playing ? <Pause size={17} fill="currentColor"/> : <Play size={17} fill="currentColor"/>}</button><span className="hidden w-10 font-mono text-[10px] text-zinc-500 sm:block">{mediaTime(elapsed)}</span><div className="min-w-0 flex-1"><div className="mb-1 flex justify-between font-mono text-[9px] text-zinc-500 sm:hidden"><span>{mediaTime(elapsed)}</span><span>{mediaTime(duration)}</span></div><input aria-label="Seek media" type="range" min="0" max={duration || 0} value={elapsed} onChange={event => seek(Number(event.target.value))} className="h-1 w-full accent-white"/></div><span className="hidden w-10 font-mono text-[10px] text-zinc-500 sm:block">{mediaTime(duration)}</span><button onClick={toggleMute} className="grid size-9 place-items-center border border-white/10 text-zinc-300 hover:bg-white/10" aria-label={muted ? 'Unmute' : 'Mute'}>{muted ? <VolumeX size={15}/> : <Volume2 size={15}/>}</button></div></div>}
    </section>
  </div>;
}

function FileTree({ tree, expanded, selected, onToggle, onSelect }: { tree: Record<string, StorageEntry[]>; expanded: Set<string>; selected: string; onToggle: (entry: StorageEntry) => void; onSelect: (entry: StorageEntry) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const renderNodes = (parent: string, depth = 0) => (tree[parent] || []).map(entry => {
    const isFolder = entry.type === 'folder';
    const open = expanded.has(entry.key);
    return <div key={entry.key}>
      <div className={`flex min-w-0 items-center ${selected === entry.key ? 'bg-white/[.08] text-white' : 'text-zinc-400 hover:bg-white/[.04] hover:text-zinc-200'}`} style={{ paddingLeft: `${10 + depth * 14}px` }}>
        {isFolder ? <button onClick={() => onToggle(entry)} className="grid size-7 shrink-0 place-items-center" aria-label={`${open ? 'Collapse' : 'Expand'} ${entry.name}`}><ChevronDown size={13} className={`transition-transform ${open ? '' : '-rotate-90'}`} /></button> : <span className="grid size-7 shrink-0 place-items-center"><File size={13}/></span>}
        <button onClick={() => onSelect(entry)} className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left text-xs"><span className="shrink-0 text-amber-300">{isFolder ? <Folder size={14}/> : null}</span><span className="truncate">{entry.name}</span></button>
      </div>
      {isFolder && open && renderNodes(entry.key, depth + 1)}
    </div>;
  });
  return <aside className="overflow-hidden border border-white/10 bg-zinc-950 lg:max-h-[calc(100svh-13rem)]"><button type="button" onClick={() => setIsOpen(value => !value)} className="flex min-h-12 w-full items-center justify-between border-b border-white/10 px-3 text-left lg:pointer-events-none"><span><span className="block font-mono text-[9px] uppercase tracking-[.18em] text-zinc-500">File tree</span><span className="mt-1 block text-xs text-zinc-400 lg:hidden">Browse folders and files</span></span><ChevronDown size={16} className={`text-zinc-500 transition-transform lg:hidden ${isOpen ? '' : '-rotate-90'}`}/></button><ScrollArea className={`${isOpen ? 'block max-h-72' : 'hidden'} lg:block lg:max-h-[calc(100svh-17rem)]`}><div className="py-1"><button onClick={() => onSelect({ type: 'folder', name: 'root', key: '' })} className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs ${selected === '' ? 'bg-white/[.08] text-white' : 'text-zinc-400 hover:bg-white/[.04]'}`}><Folder size={14} className="text-amber-300"/> Root</button>{renderNodes('')}</div></ScrollArea></aside>;
}

export default function StorageClient({ dashboardPath }: { dashboardPath: string }) {
  const [prefix, setPrefix] = useState('');
  const [entries, setEntries] = useState<StorageEntry[]>([]);
  const [status, setStatus] = useState('Loading storage…');
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<Modal | null>(null);
  const [share, setShare] = useState<{ name: string; url: string; expiresAt: number } | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [tree, setTree] = useState<Record<string, StorageEntry[]>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dragActive, setDragActive] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setBusy(true); const result = await listStorageAction(prefix);
    if ('error' in result) { setStatus(result.error || 'Storage request failed.'); setEntries([]); }
    else { setEntries(result.data); setTree(previous => ({ ...previous, [prefix]: result.data })); setStatus(`${result.data.length} item${result.data.length === 1 ? '' : 's'} in ${prefix || 'root'}`); }
    setBusy(false);
  }, [prefix]);
  useEffect(() => { void refresh(); }, [refresh]);

  const run = async (work: () => Promise<{ error: string } | { data: unknown }>) => {
    setBusy(true); const result = await work(); setBusy(false);
    if ('error' in result) setStatus(result.error); else await refresh();
    return result;
  };
  const open = async (entry: StorageEntry) => {
    if (entry.type === 'folder') { setPrefix(entry.key); return; }
    setBusy(true); const result = await previewStorageAction(entry.key); setBusy(false);
    if ('error' in result) setStatus(result.error || 'Preview unavailable.');
    else setPreview({ key: entry.key, name: entry.name, url: result.data.url, type: result.data.contentType });
  };
  const uploadFiles = async (files: File[]) => {
    if (!files.length || busy) return;
    setBusy(true);
    for (const file of files) {
      const prepared = await getStorageUploadAction(`${prefix}${file.name}`, file.type || 'application/octet-stream');
      if ('error' in prepared) { setStatus(prepared.error || 'Could not prepare upload.'); break; }
      const response = await fetch(prepared.data.url, { method: 'PUT', headers: { 'Content-Type': prepared.data.contentType }, body: file });
      if (!response.ok) { setStatus(`Upload failed for ${file.name}.`); break; }
      setStatus(`Uploaded ${file.name}`);
    }
    setBusy(false); await refresh();
  };
  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    await uploadFiles([...(event.target.files || [])]);
    event.target.value = '';
  };
  const dropFiles = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragActive(false);
    void uploadFiles([...event.dataTransfer.files]);
  };
  const submit = () => {
    if (!modal) return;
    if (modal.kind === 'folder' && modal.value.trim()) void run(async () => { const r = await createFolderAction(prefix, modal.value.trim()); if (!('error' in r)) setModal(null); return r; });
    if (modal.kind === 'delete') void run(async () => { const r = await deleteStorageAction(modal.entry.key); if (!('error' in r)) setModal(null); return r; });
    if ((modal.kind === 'rename' || modal.kind === 'copy') && modal.value.trim()) void run(async () => {
      const target = `${prefix}${modal.value.trim()}${modal.entry.type === 'folder' ? '/' : ''}`;
      const r = modal.kind === 'rename' ? await moveStorageAction(modal.entry.key, target) : await copyStorageAction(modal.entry.key, target);
      if (!('error' in r)) setModal(null); return r;
    });
  };
  const makeShare = (entry: StorageEntry) => void run(async () => {
    const r = await createStorageShareAction(entry.key);
    if (!('error' in r)) setShare({ name: entry.name, url: `${window.location.origin}/storage/share/${r.data.token}`, expiresAt: r.data.expiresAt });
    return r;
  });
  const toggleTree = async (entry: StorageEntry) => {
    if (expanded.has(entry.key)) { setExpanded(previous => { const next = new Set(previous); next.delete(entry.key); return next; }); return; }
    setExpanded(previous => new Set(previous).add(entry.key));
    if (tree[entry.key]) return;
    const result = await listStorageAction(entry.key);
    if ('error' in result) { setStatus(result.error || 'Could not load folder.'); return; }
    setTree(previous => ({ ...previous, [entry.key]: result.data }));
  };
  const crumbs = prefix.split('/').filter(Boolean);

  return <main className="min-h-screen bg-[#050505] px-3 pb-8 pt-5 text-zinc-100 sm:px-7 sm:pt-7 lg:p-10"><div className="mx-auto max-w-6xl">
    <header className="mb-5 flex flex-col gap-4 border-b border-white/10 pb-5 sm:mb-6 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[.2em] text-zinc-500 sm:text-[10px]">Dashboard / secure storage</p><h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Personal file storage</h1><p className="mt-1 max-w-xl text-sm leading-6 text-zinc-500">Private S3 storage with controlled visibility and expiring share links.</p></div><Link href={dashboardPath} className="inline-flex min-h-11 items-center justify-center border border-white/10 px-4 text-xs text-zinc-300 hover:bg-white/5">Back to dashboard</Link></header>
    <div className="grid gap-4 lg:grid-cols-[15rem_minmax(0,1fr)]"><FileTree tree={tree} expanded={expanded} selected={prefix} onToggle={toggleTree} onSelect={entry => void open(entry)} /><section onDragEnter={event => { event.preventDefault(); setDragActive(true); }} onDragOver={event => event.preventDefault()} onDragLeave={event => { if (event.currentTarget === event.target) setDragActive(false); }} onDrop={dropFiles} className={`relative overflow-hidden rounded-2xl border bg-zinc-950 transition-colors ${dragActive ? 'border-white bg-white/[.04]' : 'border-white/10'}`}><div className="flex flex-col gap-3 border-b border-white/10 p-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-1 overflow-x-auto pb-1 text-xs text-zinc-500 sm:pb-0"><button onClick={() => setPrefix('')} className="shrink-0 hover:text-white">root</button>{crumbs.map((part, index) => <span key={`${part}-${index}`} className="flex min-w-0 items-center gap-1"><ChevronRight size={12} className="shrink-0"/><button className="truncate hover:text-white" onClick={() => setPrefix(`${crumbs.slice(0, index + 1).join('/')}/`)}>{part}</button></span>)}</div><div className="flex gap-2"><button onClick={() => setModal({ kind: 'folder', value: '' })} className="grid size-11 place-items-center border border-white/10 hover:bg-white/5" aria-label="Create folder"><FolderPlus size={16}/></button><button onClick={() => fileInput.current?.click()} className="inline-flex min-h-11 items-center bg-white px-4 text-xs font-bold text-black"><Upload size={14} className="mr-2"/>Upload</button><input ref={fileInput} onChange={upload} type="file" multiple className="hidden"/></div></div>
      <div className="p-3"><p role="status" className="mb-3 flex items-center gap-2 text-xs text-zinc-500">{busy && <LoaderCircle size={13} className="animate-spin"/>}{status}<button onClick={() => void refresh()} className="ml-auto p-1 hover:text-white" aria-label="Refresh"><RefreshCw size={14}/></button></p>
      {entries.length === 0 && !busy ? <p className="py-16 text-center text-sm text-zinc-600">This folder is empty.</p> : <div className="divide-y divide-white/5">{entries.map(entry => <div key={entry.key} className="flex items-start gap-2 py-3 sm:items-center sm:gap-3"><button onClick={() => void open(entry)} className="flex min-w-0 flex-1 items-center gap-3 py-1 text-left"><span className="shrink-0 text-amber-300">{entry.type === 'folder' ? <Folder size={18}/> : <File size={18}/>}</span><span className="min-w-0"><b className="block truncate text-sm font-medium">{entry.name}</b><small className="text-zinc-600">{entry.type === 'folder' ? 'Folder' : size(entry.size)}</small>{entry.type === 'file' && <span className={`ml-2 inline-flex items-center gap-1 border px-1.5 py-0.5 font-mono text-[8px] uppercase ${entry.visibility === 'public' ? 'border-emerald-300/20 text-emerald-200' : 'border-white/10 text-zinc-500'}`}>{entry.visibility === 'public' ? <Globe2 size={10}/> : <LockKeyhole size={10}/>} {entry.visibility || 'private'}</span>}</span></button><div className="flex shrink-0 items-center gap-1">{entry.type === 'file' && <><button onClick={() => void run(() => setStorageVisibilityAction(entry.key, entry.visibility === 'public' ? 'private' : 'public'))} className="grid size-9 place-items-center rounded-lg text-zinc-400 hover:bg-white/5" aria-label="Toggle public visibility">{entry.visibility === 'public' ? <LockKeyhole size={15}/> : <Globe2 size={15}/>}</button><button onClick={() => makeShare(entry)} className="grid size-9 place-items-center rounded-lg text-zinc-400 hover:bg-white/5" aria-label="Create share link"><Share2 size={15}/></button></>}<div className="relative sm:hidden"><details className="group"><summary className="grid size-9 list-none place-items-center rounded-lg text-zinc-400 hover:bg-white/5 [&::-webkit-details-marker]:hidden" aria-label={`More actions for ${entry.name}`}><MoreHorizontal size={17}/></summary><div className="absolute right-0 top-10 z-20 grid min-w-36 overflow-hidden border border-white/15 bg-[#111] p-1 shadow-2xl"><button onClick={() => setModal({ kind: 'copy', entry, value: `copy-${entry.name}` })} className="flex min-h-10 items-center gap-2 px-3 text-left text-xs text-zinc-300 hover:bg-white/10"><Copy size={14}/>Copy</button><button onClick={() => setModal({ kind: 'rename', entry, value: entry.name })} className="flex min-h-10 items-center gap-2 px-3 text-left text-xs text-zinc-300 hover:bg-white/10"><Pencil size={14}/>Rename</button><button onClick={() => setModal({ kind: 'delete', entry })} className="flex min-h-10 items-center gap-2 px-3 text-left text-xs text-red-300 hover:bg-red-400/10"><Trash2 size={14}/>Delete</button></div></details></div><div className="hidden items-center gap-1 sm:flex">{entry.type === 'file' && <button onClick={() => void open(entry)} className="grid size-9 place-items-center text-zinc-400 hover:bg-white/5" aria-label="Preview"><Download size={15}/></button>}<button onClick={() => setModal({ kind: 'copy', entry, value: `copy-${entry.name}` })} className="grid size-9 place-items-center text-zinc-400 hover:bg-white/5" aria-label="Copy"><Copy size={15}/></button><button onClick={() => setModal({ kind: 'rename', entry, value: entry.name })} className="grid size-9 place-items-center text-zinc-400 hover:bg-white/5" aria-label="Rename"><Pencil size={15}/></button><button onClick={() => setModal({ kind: 'delete', entry })} className="grid size-9 place-items-center text-red-400 hover:bg-red-400/10" aria-label="Delete"><Trash2 size={15}/></button></div></div></div>)}</div>}</div>
    {dragActive && <div className="pointer-events-none absolute inset-2 z-10 grid place-items-center border border-dashed border-white bg-black/80"><div className="text-center"><Upload size={24} className="mx-auto mb-2"/><p className="font-mono text-[10px] uppercase tracking-[.18em]">Drop files to upload</p><p className="mt-1 text-xs text-zinc-400">They will be saved in {prefix || 'root'}</p></div></div>}</section></div>
  </div>
  {modal && <div className="fixed inset-0 z-[60] grid place-items-center bg-black/80 p-3 backdrop-blur-sm sm:p-4"><form onSubmit={(event: FormEvent) => { event.preventDefault(); submit(); }} className="w-full max-w-md rounded-2xl border border-white/15 bg-[#101010] p-5"><div className="flex justify-between gap-3"><h2 className="text-lg font-semibold">{modal.kind === 'folder' ? 'Create folder' : modal.kind === 'delete' ? 'Delete item' : modal.kind === 'copy' ? 'Duplicate item' : 'Rename item'}</h2><button type="button" onClick={() => setModal(null)} className="grid size-10 place-items-center" aria-label="Close dialog"><X size={17}/></button></div><p className="mt-3 text-sm text-zinc-400">{modal.kind === 'delete' ? `Delete ${modal.entry.name}? This cannot be undone.` : 'Choose a name for this storage item.'}</p>{modal.kind !== 'delete' && <input autoFocus value={modal.value} onChange={event => setModal({ ...modal, value: event.target.value } as Modal)} className="mt-4 h-12 w-full border border-white/15 bg-black px-3 text-base outline-none focus:border-white/45"/>}<div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setModal(null)} className="min-h-11 border border-white/10 px-4 text-sm">Cancel</button><button className="inline-flex min-h-11 items-center gap-2 bg-white px-4 text-sm font-semibold text-black"><Check size={14}/>Confirm</button></div></form></div>}
  {share && <div className="fixed inset-0 z-[60] grid place-items-center bg-black/80 p-3 backdrop-blur-sm sm:p-4"><section className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#101010] p-5"><div className="flex justify-between gap-3"><h2 className="truncate text-lg font-semibold">Share {share.name}</h2><button onClick={() => setShare(null)} className="grid size-10 place-items-center" aria-label="Close share dialog"><X size={17}/></button></div><p className="mt-3 text-sm leading-6 text-zinc-400">This private link expires {new Date(share.expiresAt).toLocaleString()}.</p><div className="mt-4 flex gap-2"><input readOnly value={share.url} className="min-w-0 flex-1 border border-white/15 bg-black px-3 py-2 font-mono text-xs"/><button onClick={() => void navigator.clipboard.writeText(share.url)} className="grid size-11 shrink-0 place-items-center bg-white text-black" aria-label="Copy link"><Link2 size={15}/></button></div></section></div>}
  {preview && <MediaPreview preview={preview} onClose={() => setPreview(null)} />}
  </main>;
}
