'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Plus, Trash2, Save, LogOut,
    Music, Link as LinkIcon, Book,
    Check, ArrowUp, ArrowDown,
    User, Eye, AlertCircle, Camera, Upload, Activity,
    Search, Youtube, Wrench, FileImage, FileVideo, LoaderCircle, Settings, SlidersHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MeConfig } from '@/lib/me-config';
import { saveMeConfigAction } from '@/app/actions/me';
import { logout } from '@/app/actions/auth';
import { disconnectSpotifyAction } from '@/app/actions/spotify';
import { searchYouTubeAction } from '@/app/actions/youtube';
import { deleteFromR2Action } from '@/app/actions/r2';
import { createMuxVideoUploadAction, deleteMuxVideoAction, getMuxVideoUploadAction } from '@/app/actions/mux';
import { uploadToR2 } from '@/lib/upload-client';
import { edgeUrl } from '@/lib/edge';
import { apiUrl } from '@/lib/api-gateway';
import { DISCORD_BADGES } from '@/lib/discord-badges';

interface MeAdminClientProps {
    initialConfig: MeConfig;
    isSpotifyConnected: boolean;
    dashboardPath: string;
}
type AdminSection = 'profile' | 'presence' | 'music' | 'widgets' | 'links' | 'resources' | 'gallery' | 'settings';
const R2_CLEANUP_QUEUE_KEY = 'avrxt:admin:r2-cleanup:v1';
const MUX_CLEANUP_QUEUE_KEY = 'avrxt:admin:mux-cleanup:v1';

function readCleanupQueue(key: string): Set<string> {
    if (typeof window === 'undefined') return new Set();
    try {
        const value: unknown = JSON.parse(window.sessionStorage.getItem(key) || '[]');
        return new Set(Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []);
    } catch {
        return new Set();
    }
}

function AdminActivityBadge({ state }: { state: 'syncing' | 'updating' | 'processing' }) {
    const copy = state === 'syncing' ? 'Syncing' : state === 'updating' ? 'Updating' : 'Processing';
    const tone = state === 'syncing'
        ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
        : state === 'updating'
            ? 'border-sky-400/20 bg-sky-400/10 text-sky-200'
            : 'border-amber-400/20 bg-amber-400/10 text-amber-100';
    return <span role="status" className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[.12em] ${tone}`}><LoaderCircle size={11} className="animate-spin" />{copy}</span>;
}

export default function MeAdminClient({ initialConfig, isSpotifyConnected, dashboardPath }: MeAdminClientProps) {
    const [config, setConfig] = useState<MeConfig>(initialConfig);
    const [ytSearchQuery, setYtSearchQuery] = useState('');
    const [ytResults, setYtResults] = useState<any[]>([]);
    const [isSearchingYt, setIsSearchingYt] = useState(false);
    const [ytError, setYtError] = useState('');
    const [saveStatus, setSaveStatus] = useState<string>('');
    const [isPending, setIsPending] = useState(false);
    const [pendingAssetCleanup, setPendingAssetCleanup] = useState<Set<string>>(() => readCleanupQueue(R2_CLEANUP_QUEUE_KEY));
    const [pendingMuxAssetCleanup, setPendingMuxAssetCleanup] = useState<Set<string>>(() => readCleanupQueue(MUX_CLEANUP_QUEUE_KEY));
    const [uploadingAsset, setUploadingAsset] = useState<{ name: string; size: number; target: string } | null>(null);
    const [activeSection, setActiveSection] = useState<AdminSection>('profile');
    const activityState = uploadingAsset ? 'processing' as const : isPending ? (saveStatus.startsWith('SYNCING') ? 'syncing' as const : 'updating' as const) : null;

    useEffect(() => {
        try { window.sessionStorage.setItem(R2_CLEANUP_QUEUE_KEY, JSON.stringify([...pendingAssetCleanup])); } catch { /* Session storage is optional. */ }
    }, [pendingAssetCleanup]);

    useEffect(() => {
        try { window.sessionStorage.setItem(MUX_CLEANUP_QUEUE_KEY, JSON.stringify([...pendingMuxAssetCleanup])); } catch { /* Session storage is optional. */ }
    }, [pendingMuxAssetCleanup]);

    // A completed profile save must not be made to look like a failed upload
    // because an object-store delete hit a short-lived network/provider error.
    const deleteR2Asset = async (url: string) => {
        let result = await deleteFromR2Action(url).catch(error => ({ error: error instanceof Error ? error.message : 'R2_DELETE_FAILED' }));
        if ('error' in result) {
            await new Promise(resolve => window.setTimeout(resolve, 700));
            result = await deleteFromR2Action(url).catch(error => ({ error: error instanceof Error ? error.message : 'R2_DELETE_FAILED' }));
        }
        return result;
    };

    const deleteMuxAsset = async (assetId: string) => {
        let result = await deleteMuxVideoAction(assetId);
        if ('error' in result) {
            await new Promise(resolve => window.setTimeout(resolve, 700));
            result = await deleteMuxVideoAction(assetId);
        }
        return result;
    };

    const handleSave = async () => {
        setIsPending(true);
        setSaveStatus('SYNCING...');
        try {
            const result = await saveMeConfigAction(config);
            if ('error' in result) {
                setSaveStatus(`ERROR: ${result.error}`);
                return;
            }

            const referencedUrls = new Set([
                config.profile.avatarUrl,
                config.profile.logoUrl,
                config.profile.bannerUrl,
                config.music.coverUrl,
                config.music.audioUrl,
                ...config.links.map(link => link.icon || ''),
                ...config.gallery.map(item => item.url),
                ...config.resources.flatMap(resource => [resource.url, resource.previewUrl || '']),
            ]);
            const cleanupUrls = [...pendingAssetCleanup].filter(url => !referencedUrls.has(url));
            const cleanupResults = await Promise.all(cleanupUrls.map(async url => ({
                url,
                result: await deleteR2Asset(url),
            })));
            const failedCleanupUrls = cleanupResults.filter(item => 'error' in item.result).map(item => item.url);
            const completedCleanupUrls = new Set(cleanupResults.filter(item => !('error' in item.result)).map(item => item.url));
            setPendingAssetCleanup(current => new Set([...current].filter(url => !completedCleanupUrls.has(url))));
            const muxCleanupResults = await Promise.all([...pendingMuxAssetCleanup].map(async assetId => ({ assetId, result: await deleteMuxAsset(assetId) })));
            const completedMuxAssetIds = new Set(muxCleanupResults.filter(item => !('error' in item.result)).map(item => item.assetId));
            setPendingMuxAssetCleanup(current => new Set([...current].filter(assetId => !completedMuxAssetIds.has(assetId))));

            const failedMuxAssetIds = muxCleanupResults.filter(item => 'error' in item.result).map(item => item.assetId);
            setSaveStatus(failedCleanupUrls.length || failedMuxAssetIds.length
                ? `SAVED: MEDIA_CLEANUP_FAILED (${failedCleanupUrls.length + failedMuxAssetIds.length}); SAVE_AGAIN_TO_RETRY`
                : result.warning || 'SUCCESS: CONFIG_SYNCED');
            if (!failedCleanupUrls.length && !failedMuxAssetIds.length && !result.warning) setTimeout(() => setSaveStatus(''), 3000);
        } catch (error) {
            setSaveStatus(`ERROR: ${error instanceof Error ? error.message : 'SAVE_FAILED'}`);
        } finally {
            setIsPending(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: string, galleryType?: 'image' | 'video') => {
        const input = e.target;
        const file = input.files?.[0];
        if (!file) return;

        let uploadFailed = false;
        setIsPending(true);
        setUploadingAsset({ name: file.name, size: file.size, target });
        setSaveStatus('UPLOADING...');

        try {
            // Determine old URL for auto-deletion if we are replacing a file
            let oldUrl: string | undefined = undefined;
            if (target === 'music.coverUrl') oldUrl = config.music.coverUrl;
            else if (target === 'music.audioUrl') oldUrl = config.music.audioUrl;
            else if (target.startsWith('profile.')) {
                const field = target.split('.')[1] as keyof typeof config.profile;
                oldUrl = config.profile[field] as string;
            } else if (target.startsWith('link:')) {
                const linkId = target.split(':')[1];
                oldUrl = config.links.find(l => l.id === linkId)?.icon;
            }

            setSaveStatus(`UPLOADING (${(file.size / 1024 / 1024).toFixed(2)}MB)...`);
            if (target === 'gallery' && (galleryType === 'video' || file.type.startsWith('video/'))) {
                const prepared = await createMuxVideoUploadAction(file.name, file.type, file.size);
                if ('error' in prepared) throw new Error(prepared.error);
                const uploadResponse = await fetch(prepared.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
                if (!uploadResponse.ok) throw new Error(`Mux rejected the video upload (${uploadResponse.status}).`);
                setSaveStatus('MUX IS ENCODING YOUR VIDEO...');
                for (let attempt = 0; attempt < 60; attempt += 1) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    const status = await getMuxVideoUploadAction(prepared.uploadId);
                    if ('error' in status) throw new Error(status.error);
                    if (status.state !== 'ready') continue;
                    setConfig(current => ({ ...current, gallery: [...(current.gallery || []), { id: Date.now().toString(), type: 'video', url: status.url, muxAssetId: status.assetId, caption: 'New Upload' }] }));
                    setSaveStatus('MUX VIDEO READY: SAVE TO PUBLISH');
                    return;
                }
                throw new Error('Mux is still encoding. Try again shortly; no gallery item was published.');
            }
            const { publicUrl } = await uploadToR2(file);

            // Step 3: Success! Update UI state
            setSaveStatus('STEP 3: FINALIZING...');
            if (target === 'gallery') {
                const fType = file.type || '';
                const newItem = {
                    id: Date.now().toString(),
                    type: galleryType || (fType.startsWith('video/') ? 'video' : 'image'),
                    url: publicUrl,
                    caption: 'New Upload'
                };
                setConfig({ ...config, gallery: [...(config.gallery || []), newItem] });
            } else if (target === 'music.coverUrl') {
                setConfig({ ...config, music: { ...config.music, coverUrl: publicUrl } });
            } else if (target === 'music.audioUrl') {
                setConfig({ ...config, music: { ...config.music, audioUrl: publicUrl, youtubeVideoId: '' } });
            } else if (target.startsWith('profile.')) {
                const field = target.split('.')[1] as keyof typeof config.profile;
                setConfig({ ...config, profile: { ...config.profile, [field]: publicUrl } });
            } else if (target.startsWith('link:')) {
                const linkId = target.split(':')[1];
                const newLinks = config.links.map(l => l.id === linkId ? { ...l, icon: publicUrl } : l);
                setConfig({ ...config, links: newLinks });
            }

            // Keep the old asset live until the config update has been saved.
            if (oldUrl && /^https?:\/\//i.test(oldUrl) && oldUrl !== publicUrl) {
                const cleanupUrl = oldUrl;
                setPendingAssetCleanup(current => new Set(current).add(cleanupUrl));
            }

            setSaveStatus('SUCCESS: UPLOAD_COMPLETE');
        } catch (error: any) {
            uploadFailed = true;
            console.error('Upload error:', error);
            setSaveStatus(`ERROR: ${error.message || 'UPLOAD_FAILED'}`);
        } finally {
            setIsPending(false);
            setUploadingAsset(null);
            input.value = '';
            // Keep error messages visible longer (8 seconds)
            // but clear success messages faster (2 seconds)
            setTimeout(() => setSaveStatus(''), uploadFailed ? 12000 : 2000);
        }
    };

    const handleDeleteGalleryItem = (id: string, url: string) => {
        const item = config.gallery.find(entry => entry.id === id);
        if (!confirm(`Remove this item from your profile? Its ${item?.muxAssetId ? 'Mux' : 'R2'} file will be deleted after you save.`)) return;
        setConfig(current => ({ ...current, gallery: current.gallery?.filter(item => item.id !== id) }));
        if (item?.muxAssetId) setPendingMuxAssetCleanup(current => new Set(current).add(item.muxAssetId!));
        else if (/^https:\/\/cdn\.avrxt\.dev\//i.test(url)) setPendingAssetCleanup(current => new Set(current).add(url));
        setSaveStatus('REMOVED_FROM_DRAFT: SAVE_TO_APPLY');
    };

    return (
        <>
            <main className="me-admin-page page-enter min-h-screen bg-black text-white p-5 sm:p-7 md:p-12 selection:bg-white/10">
                <div className="max-w-4xl mx-auto">
                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tighter uppercase mb-2 font-mono italic">Me_Dashboard</h1>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Connected_To_Node: avrxt-core-01 {activityState && <AdminActivityBadge state={activityState} />}</span>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-start md:justify-end gap-3 w-full md:w-auto">
                            <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-white/[0.035] hover:bg-white/[0.08] text-zinc-400 hover:text-white rounded-full text-[10px] font-bold font-mono transition-all border border-white/10">
                                AVRXT HOME
                            </Link>
                            <Link
                                href="/me"
                                target="_blank"
                                prefetch={false}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full text-[10px] font-bold font-mono transition-all border border-white/5"
                            >
                                <Eye size={12} /> PREVIEW
                            </Link>
                            <Link
                                href="/docs/admin"
                                prefetch={false}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-900/20 hover:bg-blue-900/40 text-blue-400 hover:text-blue-300 rounded-full text-[10px] font-bold font-mono transition-all border border-blue-500/20"
                            >
                                DOCS
                            </Link>
                            <Link
                                href={`${dashboardPath}/mail-broadcat`}
                                prefetch={false}
                                className="flex items-center gap-2 px-4 py-2 bg-white/[0.035] hover:bg-white/[0.08] text-zinc-300 hover:text-white rounded-full text-[10px] font-bold font-mono transition-all border border-white/10"
                            >
                                MAIL BROADCAST
                            </Link>
                            <button
                                onClick={handleSave}
                                disabled={isPending}
                                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-bold font-mono transition-all shadow-[0_0_20px_rgba(255,255,255,0.12)] disabled:opacity-50"
                            >
                                <Save size={14} /> {isPending ? 'SYNCING...' : 'SAVE'}
                            </button>
                            <button onClick={() => logout('/me')} className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full text-xs font-bold font-mono transition-all">
                                <LogOut size={14} /> EXIT
                            </button>
                        </div>
                    </header>

                    {/* Quick Preview Card */}
                    <div className="mb-12 p-8 rounded-3xl bg-zinc-900/30 border border-white/5 backdrop-blur-xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 opacity-50"></div>
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-6">// Live_Header_Preview</div>
                            <img
                                src={config.profile.avatarUrl}
                                alt="Preview"
                                                width={80}
                                                height={80}
                                                loading="lazy"
                                                decoding="async"
                                className="w-20 h-20 rounded-full object-cover border-2 border-white/10 shadow-2xl mb-4 bg-zinc-800"
                            />
                            <h2 className="text-2xl font-bold font-mono tracking-[0.15em] uppercase text-white">{config.profile.handle || '@USERNAME'}</h2>
                            <p className="text-sm font-light tracking-[0.2em] text-zinc-400 mt-2 uppercase italic">{config.profile.bio || 'Your bio here...'}</p>
                        </div>
                    </div>

                    {saveStatus && (
                        <div className={cn(
                            "mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
                            saveStatus.includes('ERROR') || saveStatus.includes('FAILED')
                                ? "bg-red-500/10 border border-red-500/20 text-red-500"
                                : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"
                        )}>
                            {saveStatus.includes('ERROR') || saveStatus.includes('FAILED') ? <AlertCircle size={16} /> : <Check size={16} />}
                            <span className="text-[10px] font-mono uppercase tracking-widest">{saveStatus}</span>
                        </div>
                    )}

                    <div className={cn(
                        "mb-8 flex flex-col gap-5 rounded-2xl border p-6 sm:flex-row sm:items-center sm:justify-between",
                        config.site?.maintenanceEnabled
                            ? "border-amber-500/30 bg-amber-500/10"
                            : "border-white/5 bg-zinc-900/40"
                    )}>
                        <div className="flex items-start gap-4">
                            <div className={cn(
                                "mt-0.5 rounded-xl p-2.5",
                                config.site?.maintenanceEnabled ? "bg-amber-500/15 text-amber-400" : "bg-white/5 text-zinc-500"
                            )}>
                                <Wrench size={18} />
                            </div>
                            <div>
                                <h2 className="font-mono text-sm font-bold uppercase tracking-widest">Maintenance_Mode</h2>
                                <p className="mt-1 max-w-lg text-xs leading-5 text-zinc-500">
                                    Redirect public pages to the maintenance screen. Admin, authentication, and API routes stay available. Press Save to apply.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={config.site?.maintenanceEnabled === true}
                            onClick={() => setConfig(prev => ({
                                ...prev,
                                site: { maintenanceEnabled: !prev.site?.maintenanceEnabled },
                            }))}
                            className={cn(
                                "relative h-8 w-16 shrink-0 rounded-full border transition-colors",
                                config.site?.maintenanceEnabled
                                    ? "border-amber-400/50 bg-amber-500/30"
                                    : "border-white/10 bg-zinc-800"
                            )}
                        >
                            <span className={cn(
                                "absolute top-1 h-6 w-6 rounded-full transition-all",
                                config.site?.maintenanceEnabled
                                    ? "left-9 bg-amber-300"
                                    : "left-1 bg-zinc-500"
                            )} />
                            <span className="sr-only">Toggle maintenance mode</span>
                        </button>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
                        <aside className="lg:sticky lg:top-24 lg:h-fit"><p className="mb-3 hidden font-mono text-[9px] uppercase tracking-[.18em] text-zinc-600 lg:block">Studio sections</p><nav aria-label="Admin sections" className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">{([{ id: 'profile', label: 'Profile', Icon: User }, { id: 'presence', label: 'Presence', Icon: Activity }, { id: 'music', label: 'Music', Icon: Music }, { id: 'widgets', label: 'Widgets', Icon: SlidersHorizontal }, { id: 'links', label: 'Links', Icon: LinkIcon }, { id: 'resources', label: 'Resources', Icon: Book }, { id: 'gallery', label: 'Visual feed', Icon: Camera }, { id: 'settings', label: 'Settings', Icon: Settings }] as const).map(({ id, label, Icon }) => <button key={id} type="button" onClick={() => setActiveSection(id)} aria-pressed={activeSection === id} className={cn('flex min-h-10 shrink-0 items-center gap-3 rounded-lg border px-3 text-left text-xs transition-colors lg:w-full', activeSection === id ? 'border-white/20 bg-white/[.08] text-white' : 'border-transparent text-zinc-500 hover:bg-white/[.04] hover:text-zinc-200')}><Icon size={15} />{label}</button>)}</nav></aside>
                        <div className="min-w-0"><div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                        {/* Left Column */}
                        <div className="space-y-6">
                            {/* Profile Settings */}
                            <div className={cn("p-6 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-4", activeSection !== 'profile' && 'hidden')}>
                                <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 font-mono">
                                    <User size={16} className="text-zinc-500" /> Profile_Data
                                </h2>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={config.profile.handle}
                                        onChange={(e) => setConfig({ ...config, profile: { ...config.profile, handle: e.target.value } })}
                                        className="admin-input"
                                        placeholder="Handle (@avrxt)"
                                    />
                                    <input
                                        type="text"
                                        value={config.profile.bio}
                                        onChange={(e) => setConfig({ ...config, profile: { ...config.profile, bio: e.target.value } })}
                                        className="admin-input"
                                        placeholder="Bio"
                                    />
                                    <input
                                        type="text"
                                        value={config.profile.avatarUrl}
                                        onChange={(e) => setConfig({ ...config, profile: { ...config.profile, avatarUrl: e.target.value } })}
                                        className="admin-input"
                                        placeholder="Avatar URL"
                                    />
                                    <div className="flex items-center gap-2">
                                        <label className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg cursor-pointer transition-all border border-white/5">
                                            <Upload size={12} className="text-zinc-400" />
                                            <span className="text-[10px] font-mono font-bold text-zinc-300">UPLOAD_AVATAR</span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                                                onChange={(e) => handleFileUpload(e, 'profile.avatarUrl')}
                                            />
                                        </label>
                                    </div>
                                    <input
                                        type="text"
                                        value={config.profile.logoUrl || ''}
                                        onChange={(e) => setConfig({ ...config, profile: { ...config.profile, logoUrl: e.target.value } })}
                                        className="admin-input"
                                        placeholder="Logo URL (Nav Icon)"
                                    />
                                    <input
                                        type="text"
                                        value={config.profile.bannerUrl || ''}
                                        onChange={(e) => setConfig({ ...config, profile: { ...config.profile, bannerUrl: e.target.value } })}
                                        className="admin-input"
                                        placeholder="Gallery Banner URL"
                                    />
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between px-1">
                                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Weather_Widget</span>
                                            <button
                                                onClick={() => setConfig({
                                                    ...config,
                                                    profile: { ...config.profile, weatherEnabled: config.profile.weatherEnabled === false }
                                                })}
                                                className={cn(
                                                    "px-3 py-1 rounded-md text-[9px] font-bold font-mono transition-all uppercase",
                                                    config.profile.weatherEnabled !== false ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-zinc-800 text-zinc-500 border border-white/5"
                                                )}
                                            >
                                                {config.profile.weatherEnabled !== false ? 'ENABLED' : 'DISABLED'}
                                            </button>
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={config.profile.location || ''}
                                                onChange={(e) => setConfig({ ...config, profile: { ...config.profile, location: e.target.value, weatherCoordinates: undefined } })}
                                                className="admin-input flex-1"
                                                placeholder="City Name (e.g. Chennai)"
                                            />
                                            <button
                                                onClick={async () => {
                                                    const query = config.profile.location?.trim();
                                                    if (!query) return;
                                                    setSaveStatus('SEARCHING_GEO...');
                                                    try {
                                                        const path = `/v1/geo/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
                                                        const res = await fetch(apiUrl(path, edgeUrl(`/v1/fnc/geo/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`)), { cache: 'no-store' });
                                                        const data = await res.json();
                                                        if (data.results?.length) {
                                                            // We'll use a simple alert/prompt for now or just take the first one
                                                            const first = data.results[0];
                                                            setConfig({
                                                                ...config,
                                                                profile: { ...config.profile, location: `${first.name}, ${first.country}`, weatherCoordinates: { latitude: first.latitude, longitude: first.longitude } }
                                                            });
                                                            setSaveStatus(`FOUND: ${first.name}`);
                                                        } else {
                                                            setSaveStatus('ERROR: NOT_FOUND');
                                                        }
                                                    } catch (e) {
                                                        setSaveStatus('ERROR: GEO_FAIL');
                                                    }
                                                }}
                                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-[10px] font-bold font-mono border border-white/5 transition-all"
                                            >
                                                FIND
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg cursor-pointer transition-all border border-white/5">
                                            <Upload size={12} className="text-zinc-400" />
                                            <span className="text-[10px] font-mono font-bold text-zinc-300">UPLOAD_BANNER</span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                                                onChange={(e) => handleFileUpload(e, 'profile.bannerUrl')}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Presence Settings */}
                            <div className={cn("p-6 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-4", activeSection !== 'presence' && 'hidden')}>
                                <div className="flex justify-between items-center">
                                    <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 font-mono">
                                        <Activity size={16} className="text-zinc-500" /> Presence_System
                                    </h2>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-mono text-zinc-500 uppercase">Automated</span>
                                        <button
                                            onClick={() => setConfig({
                                                ...config,
                                                profile: {
                                                    ...config.profile,
                                                    presence: {
                                                        ...config.profile.presence,
                                                        mode: config.profile.presence?.mode === 'auto' ? 'manual' : 'auto'
                                                    }
                                                }
                                            })}
                                            className={cn(
                                                "w-10 h-5 rounded-full transition-all relative border",
                                                config.profile.presence?.mode === 'auto' ? "bg-blue-500/20 border-blue-500/50" : "bg-white/5 border-white/10"
                                            )}
                                        >
                                            <div className={cn(
                                                "absolute top-1 w-2.5 h-2.5 rounded-full transition-all",
                                                config.profile.presence?.mode === 'auto' ? "right-1 bg-blue-500" : "left-1 bg-zinc-600"
                                            )}></div>
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center",
                                                config.profile.presence?.discordId ? "bg-indigo-500/10" : "bg-white/5"
                                            )}>
                                                <svg className={cn("w-4 h-4", config.profile.presence?.discordId ? "text-indigo-400" : "text-zinc-500")} viewBox="0 0 127.14 96.36" fill="currentColor">
                                                    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.71,32.65-1.82,56.6,0.48,80.21a105.73,105.73,0,0,0,32.28,16.15,77.7,77.7,0,0,0,7.37-12,67.39,67.39,0,0,1-11.87-5.65c0.99-.71,2-1.47,3-2.25a74.61,74.61,0,0,0,64.74,0c1,0.78,2,1.54,3,2.25a67.49,67.49,0,0,1-11.89,5.65,77.83,77.83,0,0,0,7.38,12,105.51,105.51,0,0,0,32.31-16.15C130.58,50.46,126.1,26.79,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                                                </svg>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Discord_Lanyard</span>
                                                <span className="text-[9px] font-mono text-zinc-500 uppercase">{config.profile.presence?.discordId ? "CONNECTED" : "NOT_CONNECTED"}</span>
                                            </div>
                                        </div>

                                        {config.profile.presence?.discordId ? (
                                            <button
                                                onClick={() => setConfig({
                                                    ...config,
                                                    profile: {
                                                        ...config.profile,
                                                        presence: {
                                                            ...config.profile.presence,
                                                            mode: config.profile.presence?.mode || 'manual',
                                                            discordId: ''
                                                        }
                                                    }
                                                })}
                                                className="text-[9px] font-mono font-bold text-red-400 hover:text-red-300 transition-colors uppercase"
                                            >
                                                [DISCONNECT]
                                            </button>
                                        ) : (
                                            <Link
                                                href="/auth/start?provider=discord&next=%2Fdashboard"
                                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-bold font-mono rounded-md transition-all uppercase"
                                            >
                                                Connect_Discord
                                            </Link>
                                        )}
                                    </div>

                                    {config.profile.presence?.discordId && (
                                        <div className="pt-2">
                                            <input
                                                type="text"
                                                className="admin-input text-[10px] py-2 bg-black/20"
                                                value={config.profile.presence.discordId}
                                                onChange={(e) => setConfig({
                                                    ...config,
                                                    profile: {
                                                        ...config.profile,
                                                        presence: {
                                                            ...config.profile.presence,
                                                            mode: config.profile.presence?.mode || 'manual',
                                                            discordId: e.target.value
                                                        }
                                                    }
                                                })}
                                                placeholder="Discord User ID"
                                            />

                                            <div className="mt-3 flex items-center justify-between gap-3">
                                                <span className={cn(
                                                    "text-[10px] font-mono uppercase tracking-widest",
                                                    config.profile.presence?.discordId ? "text-zinc-500" : "text-zinc-700"
                                                )}>Server_Tag</span>
                                                <button
                                                    onClick={() => setConfig({
                                                        ...config,
                                                        profile: {
                                                            ...config.profile,
                                                            presence: {
                                                                ...config.profile.presence,
                                                                mode: config.profile.presence?.mode || 'manual',
                                                                serverTagEnabled: !(config.profile.presence?.serverTagEnabled !== false),
                                                            }
                                                        }
                                                    })}
                                                    className={cn(
                                                        "w-10 h-5 rounded-full transition-all relative border",
                                                        (config.profile.presence?.serverTagEnabled !== false) ? "bg-emerald-500/20 border-emerald-500/50" : "bg-white/5 border-white/10"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "absolute top-1 w-2.5 h-2.5 rounded-full transition-all",
                                                        (config.profile.presence?.serverTagEnabled !== false) ? "right-1 bg-emerald-500" : "left-1 bg-zinc-600"
                                                    )}></div>
                                                </button>
                                            </div>

                                            <div className="mt-3 flex items-center justify-between gap-3">
                                                <span className={cn(
                                                    "text-[10px] font-mono uppercase tracking-widest",
                                                    config.profile.presence?.discordId ? "text-zinc-500" : "text-zinc-700"
                                                )}>Discord_Badges</span>
                                            <button
                                                onClick={() => {
                                                    const currentlyEnabled = config.profile.presence?.badgesEnabled !== false;
                                                    const nextEnabled = !currentlyEnabled;
                                                    setConfig({
                                                        ...config,
                                                        profile: {
                                                            ...config.profile,
                                                            presence: {
                                                                ...config.profile.presence,
                                                                mode: config.profile.presence?.mode || 'manual',
                                                                badgesEnabled: nextEnabled,
                                                                badgesMode: nextEnabled ? (config.profile.presence?.badgesMode || 'auto') : 'auto'
                                                            }
                                                        }
                                                    });
                                                }}
                                                className={cn(
                                                    "w-10 h-5 rounded-full transition-all relative border",
                                                    (config.profile.presence?.badgesEnabled !== false) ? "bg-emerald-500/20 border-emerald-500/50" : "bg-white/5 border-white/10"
                                                )}
                                            >
                                                    <div className={cn(
                                                        "absolute top-1 w-2.5 h-2.5 rounded-full transition-all",
                                                        (config.profile.presence?.badgesEnabled !== false) ? "right-1 bg-emerald-500" : "left-1 bg-zinc-600"
                                                    )}></div>
                                                </button>
                                            </div>

                                            <div className="mt-4 flex items-center justify-between gap-3">
                                                <span className={cn(
                                                    "text-[10px] font-mono uppercase tracking-widest",
                                                    config.profile.presence?.discordId ? "text-zinc-500" : "text-zinc-700"
                                                )}>Badges_Mode</span>
                                                <button
                                                    onClick={() => setConfig({
                                                        ...config,
                                                        profile: {
                                                            ...config.profile,
                                                            presence: {
                                                                ...config.profile.presence,
                                                                mode: config.profile.presence?.mode || 'manual',
                                                                badgesMode: (config.profile.presence?.badgesMode || 'auto') === 'auto' ? 'manual' : 'auto'
                                                            }
                                                        }
                                                    })}
                                                    disabled={config.profile.presence?.badgesEnabled === false}
                                                    className={cn(
                                                        "px-3 py-1 rounded-md text-[9px] font-bold font-mono transition-all uppercase border",
                                                        config.profile.presence?.badgesEnabled === false && "opacity-40 cursor-not-allowed",
                                                        (config.profile.presence?.badgesMode || 'auto') === 'manual'
                                                            ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                                                            : "bg-blue-500/15 text-blue-300 border-blue-500/30"
                                                    )}
                                                >
                                                    {(config.profile.presence?.badgesMode || 'auto') === 'manual' ? 'MANUAL' : 'AUTO'}
                                                </button>
                                            </div>

                                            {(config.profile.presence?.badgesEnabled !== false) && ((config.profile.presence?.badgesMode || 'auto') === 'manual') && (
                                                <div className="mt-3 rounded-xl bg-black/30 border border-white/5 p-3">
                                                    <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mb-2">Select_Badges</div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {DISCORD_BADGES.map((badge) => {
                                                            const enabled = Boolean(config.profile.presence?.badgesManual?.[badge.id]);
                                                            return (
                                                                <label
                                                                    key={badge.id}
                                                                    className={cn(
                                                                        "flex items-center gap-2 px-2 py-1.5 rounded-lg border cursor-pointer select-none transition-all",
                                                                        enabled ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white/0 border-white/5 hover:border-white/10"
                                                                    )}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={enabled}
                                                                        onChange={(e) => {
                                                                            const next = Boolean(e.target.checked);
                                                                            setConfig({
                                                                                ...config,
                                                                                profile: {
                                                                                    ...config.profile,
                                                                                    presence: {
                                                                                        ...config.profile.presence,
                                                                                        mode: config.profile.presence?.mode || 'manual',
                                                                                        badgesMode: 'manual',
                                                                                        badgesManual: {
                                                                                            ...(config.profile.presence?.badgesManual || {}),
                                                                                            [badge.id]: next
                                                                                        }
                                                                                    }
                                                                                }
                                                                            });
                                                                        }}
                                                                        className="accent-emerald-500"
                                                                    />
                                                                    <span className="text-[9px] font-mono text-zinc-300 truncate" title={badge.label}>
                                                                        {badge.label}
                                                                    </span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {config.profile.presence?.mode === 'manual' && (
                                    <div className="space-y-3 pt-2">
                                        <label className="text-[10px] text-zinc-500 uppercase tracking-widest block">Manual Status Override</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={config.profile.status?.text || ''}
                                                onChange={(e) => setConfig({
                                                    ...config,
                                                    profile: {
                                                        ...config.profile,
                                                        status: {
                                                            text: e.target.value,
                                                            color: config.profile.status?.color || 'green'
                                                        }
                                                    }
                                                })}
                                                className="admin-input flex-1"
                                                placeholder="Status (e.g. Coding)"
                                            />
                                            <select
                                                value={config.profile.status?.color || 'green'}
                                                onChange={(e) => setConfig({
                                                    ...config,
                                                    profile: {
                                                        ...config.profile,
                                                        status: {
                                                            text: config.profile.status?.text || '',
                                                            color: e.target.value as any
                                                        }
                                                    }
                                                })}
                                                className="bg-zinc-900 border border-white/5 rounded-lg px-2 text-xs font-mono text-zinc-300 outline-none"
                                            >
                                                <option value="green">Green</option>
                                                <option value="yellow">Yellow</option>
                                                <option value="red">Red</option>
                                                <option value="blue">Blue</option>
                                                <option value="purple">Purple</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Music Settings */}
                            <div className={cn("p-6 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-4", activeSection !== 'music' && 'hidden')}>
                                <div className="flex justify-between items-center">
                                    <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 font-mono">
                                        <Music size={16} className="text-zinc-500" /> Current_Freq
                                    </h2>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-mono text-zinc-500 uppercase">Live_Spotify</span>
                                        <button
                                            onClick={() => setConfig({
                                                ...config,
                                                music: {
                                                    ...config.music,
                                                    spotifyEnabled: !config.music.spotifyEnabled,
                                                    // When disabling Spotify, also disable ambient to prevent confusion.
                                                    spotifyAmbientEnabled: config.music.spotifyEnabled ? false : config.music.spotifyAmbientEnabled
                                                }
                                            })}
                                            className={cn(
                                                "w-10 h-5 rounded-full transition-all relative border",
                                                config.music.spotifyEnabled ? "bg-emerald-500/20 border-emerald-500/50" : "bg-white/5 border-white/10"
                                            )}
                                        >
                                            <div className={cn(
                                                "absolute top-1 w-2.5 h-2.5 rounded-full transition-all",
                                                config.music.spotifyEnabled ? "right-1 bg-emerald-500" : "left-1 bg-zinc-600"
                                            )}></div>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-[10px] font-mono uppercase",
                                            config.music.spotifyEnabled ? "text-zinc-500" : "text-zinc-700"
                                        )}>Spotify_Ambient</span>
                                        <span className="text-[9px] font-mono text-zinc-700 uppercase">(cover_glow)</span>
                                    </div>
                                    <button
                                        onClick={() => setConfig({
                                            ...config,
                                            music: { ...config.music, spotifyAmbientEnabled: !config.music.spotifyAmbientEnabled }
                                        })}
                                        disabled={!config.music.spotifyEnabled}
                                        className={cn(
                                            "w-10 h-5 rounded-full transition-all relative border",
                                            !config.music.spotifyEnabled && "opacity-40 cursor-not-allowed",
                                            config.music.spotifyAmbientEnabled ? "bg-emerald-500/20 border-emerald-500/50" : "bg-white/5 border-white/10"
                                        )}
                                    >
                                        <div className={cn(
                                            "absolute top-1 w-2.5 h-2.5 rounded-full transition-all",
                                            config.music.spotifyAmbientEnabled ? "right-1 bg-emerald-500" : "left-1 bg-zinc-600"
                                        )}></div>
                                    </button>
                                </div>

                                {/* Spotify Connection */}
                                <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center",
                                                isSpotifyConnected ? "bg-emerald-500/10" : "bg-white/5"
                                            )}>
                                                <svg className={cn("w-4 h-4", isSpotifyConnected ? "text-emerald-500" : "text-zinc-500")} viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.485 17.303c-.212.347-.662.455-1.009.244-2.822-1.725-6.375-2.113-10.559-1.159-.396.091-.796-.159-.887-.556-.092-.396.159-.797.555-.888 4.582-1.048 8.514-.606 11.656 1.312.347.213.454.662.244 1.047zm1.464-3.264c-.268.434-.833.573-1.267.306-3.227-1.983-8.147-2.556-11.963-1.397-.49.149-1.009-.129-1.157-.619-.149-.489.13-1.009.619-1.157 4.364-1.324 9.802-.68 13.464 1.571.434.267.573.833.306 1.267.001-.001.001 0 0 .029zm.126-3.4c-3.871-2.298-10.264-2.509-13.974-1.383-.593.18-1.224-.162-1.404-.755-.18-.593.162-1.224.755-1.404 4.256-1.291 11.316-1.039 15.786 1.614.533.317.708 1.005.392 1.538-.316.533-1.005.708-1.538.391l-.017-.001z" />
                                                </svg>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Spotify_Sync</span>
                                                <span className="text-[9px] font-mono text-zinc-500 uppercase">{isSpotifyConnected ? "CONNECTED" : "NOT_CONNECTED"}</span>
                                            </div>
                                        </div>

                                        {isSpotifyConnected ? (
                                            <button
                                                onClick={async () => {
                                                    if (confirm('Disconnect Spotify?')) {
                                                        const res = await disconnectSpotifyAction();
                                                        if (res.success) window.location.reload();
                                                    }
                                                }}
                                                className="text-[9px] font-mono font-bold text-red-400 hover:text-red-300 transition-colors uppercase"
                                            >
                                                [DISCONNECT]
                                            </button>
                                        ) : (
                                            <Link
                                                href="/api/spotify/auth"
                                                className="px-3 py-1.5 bg-[#1DB954] hover:bg-[#1ed760] text-black text-[9px] font-bold font-mono rounded-md transition-all uppercase"
                                            >
                                                Connect_Spotify
                                            </Link>
                                        )}
                                    </div>
                                </div>

                                {/* YouTube Search Section */}
                                <div className="space-y-3 pt-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Youtube size={13} className="text-red-500" />
                                        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Search_YouTube</h3>
                                    </div>

                                    {/* Search input */}
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={ytSearchQuery}
                                            onChange={(e) => { setYtSearchQuery(e.target.value); setYtError(''); }}
                                            onKeyDown={async (e) => {
                                                if (e.key === 'Enter' && ytSearchQuery.trim()) {
                                                    setIsSearchingYt(true); setYtError('');
                                                    const res = await searchYouTubeAction(ytSearchQuery.trim());
                                                    if (Array.isArray(res)) setYtResults(res);
                                                    else setYtError((res as any)?.error || 'Search failed');
                                                    setIsSearchingYt(false);
                                                }
                                            }}
                                            className="admin-input pr-10"
                                            placeholder="Search YouTube for a song..."
                                        />
                                        <button
                                            onClick={async () => {
                                                if (!ytSearchQuery.trim()) return;
                                                setIsSearchingYt(true); setYtError('');
                                                const res = await searchYouTubeAction(ytSearchQuery.trim());
                                                if (Array.isArray(res)) setYtResults(res);
                                                else setYtError((res as any)?.error || 'Search failed');
                                                setIsSearchingYt(false);
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 group-hover:text-red-400 transition-colors"
                                        >
                                            {isSearchingYt
                                                ? <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                                : <Search size={14} />}
                                        </button>
                                    </div>

                                    {/* Error */}
                                    {ytError && (
                                        <div className="text-[9px] font-mono text-red-400 px-1">{ytError}</div>
                                    )}

                                    {/* Results */}
                                    {ytResults.length > 0 && (
                                        <div className="max-h-56 overflow-y-auto space-y-2 p-2 rounded-xl bg-black/40 border border-white/5 custom-scrollbar">
                                            {ytResults.map((item) => (
                                                <button
                                                    key={item.videoId}
                                                    onClick={() => {
                                                        setConfig({
                                                            ...config,
                                                            music: {
                                                                ...config.music,
                                                                title: item.title,
                                                                artist: item.channelTitle,
                                                                coverUrl: item.thumbnail,
                                                                audioUrl: '',
                                                                youtubeVideoId: item.videoId,
                                                            }
                                                        });
                                                        setYtResults([]);
                                                        setYtSearchQuery('');
                                                    }}
                                                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all text-left group"
                                                >
                                                    <div className="relative shrink-0 w-16 h-9 rounded overflow-hidden border border-white/5">
                                                        <img src={item.thumbnail} className="w-full h-full object-cover" alt="" loading="lazy" decoding="async" />
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <div className="w-4 h-4 bg-red-500 rounded-sm flex items-center justify-center">
                                                                <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[7px] border-l-white border-b-[4px] border-b-transparent ml-0.5" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[9px] font-bold text-white truncate leading-tight">{item.title}</div>
                                                        <div className="text-[8px] font-mono text-zinc-500 uppercase truncate mt-0.5">{item.channelTitle}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Selected Song Preview + Editable Title/Artist */}
                                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-3">
                                        <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Current_Freq_Preview</div>
                                        <div className="flex items-center gap-3">
                                            {config.music.youtubeVideoId ? (
                                                <div className="relative w-16 h-9 rounded overflow-hidden border border-red-500/20 shrink-0">
                                                    <img src={`https://img.youtube.com/vi/${config.music.youtubeVideoId}/mqdefault.jpg`} className="w-full h-full object-cover" alt="" loading="lazy" decoding="async" />
                                                    <div className="absolute bottom-0.5 right-0.5">
                                                        <Youtube size={10} className="text-red-500" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-16 h-9 rounded bg-zinc-900 border border-white/5 shrink-0 flex items-center justify-center">
                                                    <Youtube size={12} className="text-zinc-700" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0 space-y-1.5">
                                                <input
                                                    type="text"
                                                    value={config.music.title}
                                                    onChange={(e) => setConfig({ ...config, music: { ...config.music, title: e.target.value } })}
                                                    className="admin-input py-1.5 text-[10px] font-bold uppercase tracking-wider"
                                                    placeholder="Song Title"
                                                />
                                                <input
                                                    type="text"
                                                    value={config.music.artist}
                                                    onChange={(e) => setConfig({ ...config, music: { ...config.music, artist: e.target.value } })}
                                                    className="admin-input py-1.5 text-[9px] font-mono"
                                                    placeholder="Artist Name"
                                                />
                                            </div>
                                        </div>
                                        {config.music.youtubeVideoId && (
                                            <div className="text-[7px] font-mono text-red-500/40 pt-1">yt_id:{config.music.youtubeVideoId}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>{/* END Left Column */}

                        {/* Right Column */}
                        <div className="space-y-6">
                            {/* Widget Settings */}
                            <div className={cn("p-6 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-4", activeSection !== 'widgets' && 'hidden')}>
                                <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 font-mono">
                                    <Activity size={16} className="text-zinc-500" /> Widget_Control
                                </h2>

                                {/* Quote Toggle */}
                                <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">Daily_Quotes</span>
                                        <span className="text-[8px] font-mono text-zinc-500 uppercase">Updates every 24h</span>
                                    </div>
                                    <button
                                        onClick={() => setConfig({
                                            ...config,
                                            widgets: { ...config?.widgets!, quotesEnabled: !config?.widgets?.quotesEnabled }
                                        })}
                                        className={cn(
                                            "px-3 py-1 rounded-md text-[9px] font-bold font-mono transition-all uppercase",
                                            config?.widgets?.quotesEnabled ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-zinc-800 text-zinc-500 border border-white/5"
                                        )}
                                    >
                                        {config?.widgets?.quotesEnabled ? 'ENABLED' : 'DISABLED'}
                                    </button>
                                </div>

                                {/* Note Widget */}
                                <div className="space-y-3 p-3 rounded-xl bg-black/40 border border-white/5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Profile_Note</span>
                                            <span className="text-[8px] font-mono text-zinc-500 uppercase">Instagram Style Note</span>
                                        </div>
                                        <button
                                            onClick={() => setConfig({
                                                ...config,
                                                widgets: { ...config?.widgets!, notesEnabled: !config?.widgets?.notesEnabled }
                                            })}
                                            className={cn(
                                                "px-3 py-1 rounded-md text-[9px] font-bold font-mono transition-all uppercase",
                                                config?.widgets?.notesEnabled ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-zinc-800 text-zinc-500 border border-white/5"
                                            )}
                                        >
                                            {config?.widgets?.notesEnabled ? 'ENABLED' : 'DISABLED'}
                                        </button>
                                    </div>

                                    {config?.widgets?.notesEnabled && (
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                maxLength={60}
                                                value={config?.widgets?.note?.text || ''}
                                                onChange={(e) => setConfig({
                                                    ...config,
                                                    widgets: {
                                                        ...config?.widgets!,
                                                        note: {
                                                            text: e.target.value,
                                                            createdAt: config?.widgets?.note?.createdAt || new Date().toISOString()
                                                        }
                                                    }
                                                })}
                                                className="admin-input text-[10px]"
                                                placeholder="What's on your mind? (max 60 chars)"
                                            />
                                            <div className="flex justify-between items-center">
                                                <span className="text-[8px] font-mono text-zinc-600">
                                                    {config?.widgets?.note?.createdAt ? `POSTED: ${new Date(config.widgets.note.createdAt).toLocaleString()}` : 'NEW_NOTE'}
                                                </span>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setConfig({
                                                            ...config,
                                                            widgets: {
                                                                ...config?.widgets!,
                                                                note: {
                                                                    text: config?.widgets?.note?.text || '',
                                                                    createdAt: new Date().toISOString()
                                                                }
                                                            }
                                                        })}
                                                        className="text-[8px] font-mono text-emerald-500 hover:text-emerald-400 uppercase"
                                                    >
                                                        [UPDATE_TIME]
                                                    </button>
                                                    <button
                                                        onClick={() => setConfig({
                                                            ...config,
                                                            widgets: {
                                                                ...config?.widgets!,
                                                                note: { text: '', createdAt: '' }
                                                            }
                                                        })}
                                                        className="text-[8px] font-mono text-red-500 hover:text-red-400 uppercase"
                                                    >
                                                        [REMOVE]
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Links Settings */}
                            <div className={cn("p-6 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-4", activeSection !== 'links' && 'hidden')}>
                                <div className="flex justify-between items-center">
                                    <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 font-mono">
                                        <LinkIcon size={16} className="text-zinc-500" /> Connections
                                    </h2>
                                    <button
                                        onClick={() => {
                                            const newLinks = [...config.links, { id: Date.now().toString(), name: 'New Link', url: 'https://', type: 'social' as const }];
                                            setConfig({ ...config, links: newLinks });
                                            setTimeout(() => {
                                                const container = document.getElementById('links-container');
                                                if (container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
                                            }, 100);
                                        }}
                                        className="text-[10px] font-mono px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 transition-all font-bold border border-white/10 uppercase tracking-tighter"
                                    >
                                        + ADD_CONNECTION
                                    </button>
                                </div>
                                <div id="links-container" className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                    {config.links.map((link, idx) => (
                                        <div key={link.id} className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3 group hover:border-white/20 transition-all">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex flex-col gap-0.5">
                                                        <button
                                                            disabled={idx === 0}
                                                            onClick={() => {
                                                                const newLinks = [...config.links];
                                                                [newLinks[idx], newLinks[idx - 1]] = [newLinks[idx - 1], newLinks[idx]];
                                                                setConfig({ ...config, links: newLinks });
                                                            }}
                                                            className="p-0.5 hover:bg-white/10 rounded text-zinc-600 disabled:opacity-0"
                                                        >
                                                            <ArrowUp size={10} />
                                                        </button>
                                                        <button
                                                            disabled={idx === config.links.length - 1}
                                                            onClick={() => {
                                                                const newLinks = [...config.links];
                                                                [newLinks[idx], newLinks[idx + 1]] = [newLinks[idx + 1], newLinks[idx]];
                                                                setConfig({ ...config, links: newLinks });
                                                            }}
                                                            className="p-0.5 hover:bg-white/10 rounded text-zinc-600 disabled:opacity-0"
                                                        >
                                                            <ArrowDown size={10} />
                                                        </button>
                                                    </div>
                                                    <input
                                                        className="bg-transparent border-none text-[10px] font-bold uppercase tracking-[0.15em] outline-none text-white focus:text-emerald-400 transition-colors"
                                                        value={link.name}
                                                        onChange={(e) => {
                                                            const newLinks = [...config.links];
                                                            newLinks[idx] = { ...newLinks[idx], name: e.target.value };
                                                            setConfig({ ...config, links: newLinks });
                                                        }}
                                                        placeholder="LABEL"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => setConfig({ ...config, links: config.links.filter(l => l.id !== link.id) })}
                                                    className="text-white/20 hover:text-red-500 transition-all opacity-40 group-hover:opacity-100 p-1"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                            <div className="flex gap-2">
                                                <select
                                                    value={link.icon?.startsWith('http') ? 'Image' : (link.icon || 'ExternalLink')}
                                                    onChange={(e) => {
                                                        const newLinks = [...config.links];
                                                        const val = e.target.value;
                                                        // If switching to Image, current val might be a name. If switching away, set to name.
                                                        if (val === 'Image') {
                                                            // Keep current if it is a URL, else empty
                                                            newLinks[idx] = { ...newLinks[idx], icon: link.icon?.startsWith('http') ? link.icon : '' };
                                                        } else {
                                                            newLinks[idx] = { ...newLinks[idx], icon: val };
                                                        }
                                                        setConfig({ ...config, links: newLinks });
                                                    }}
                                                    className="bg-zinc-900 border border-white/5 rounded-lg px-2 py-1 text-[10px] font-mono text-zinc-400 outline-none focus:border-white/20"
                                                >
                                                    <option value="Instagram">Instagram</option>
                                                    <option value="Github">Github</option>
                                                    <option value="Mail">Mail</option>
                                                    <option value="Discord">Discord</option>
                                                    <option value="Camera">Camera</option>
                                                    <option value="BookOpen">BookOpen</option>
                                                    <option value="ExternalLink">External</option>
                                                    <option value="Share2">Share</option>
                                                    <option value="Image">CUSTOM IMG</option>
                                                </select>

                                                {(link.icon === 'Image' || link.icon?.startsWith('http') || link.icon === '' && config.links[idx].icon === '') && (
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            className="bg-zinc-900/50 border border-white/5 rounded-lg px-2 py-1 text-[10px] w-20"
                                                            value={link.icon}
                                                            onChange={(e) => {
                                                                const newLinks = [...config.links];
                                                                newLinks[idx] = { ...newLinks[idx], icon: e.target.value };
                                                                setConfig({ ...config, links: newLinks });
                                                            }}
                                                            placeholder="ICON_URL"
                                                        />
                                                        <label className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg cursor-pointer border border-white/5">
                                                            <Upload size={10} className="text-zinc-400" />
                                                            <input
                                                                type="file"
                                                                className="hidden"
                                                                accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                                                                onChange={(e) => handleFileUpload(e, `link:${link.id}`)}
                                                            />
                                                        </label>
                                                    </div>
                                                )}
                                                <input
                                                    className="bg-zinc-900/50 border border-white/5 rounded-lg px-3 py-1.5 text-[10px] font-mono text-zinc-400 focus:text-white outline-none flex-1 focus:border-white/20 transition-all"
                                                    value={link.url}
                                                    onChange={(e) => {
                                                        const newLinks = [...config.links];
                                                        newLinks[idx] = { ...newLinks[idx], url: e.target.value };
                                                        setConfig({ ...config, links: newLinks });
                                                    }}
                                                    placeholder="URL"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Resources Settings */}
                            <div className={cn("p-6 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-4", activeSection !== 'resources' && 'hidden')}>
                                <div className="flex justify-between items-center">
                                    <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 font-mono">
                                        <Book size={16} className="text-zinc-500" /> Resources
                                    </h2>
                                    <button
                                        onClick={() => {
                                            const newResources = [...config.resources, { id: Date.now().toString(), title: 'New Resource', url: '/', type: 'doc' as const }];
                                            setConfig({ ...config, resources: newResources });
                                            setTimeout(() => {
                                                const container = document.getElementById('resources-container');
                                                if (container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
                                            }, 100);
                                        }}
                                        className="text-[10px] font-mono px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 transition-all font-bold border border-white/10 uppercase tracking-tighter"
                                    >
                                        + ADD_CORE_RES
                                    </button>
                                </div>
                                <div id="resources-container" className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                                    {config.resources.map((res, idx) => (
                                        <div key={res.id} className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3 group hover:border-white/20 transition-all">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex flex-col gap-0.5">
                                                        <button
                                                            disabled={idx === 0}
                                                            onClick={() => {
                                                                const newRes = [...config.resources];
                                                                [newRes[idx], newRes[idx - 1]] = [newRes[idx - 1], newRes[idx]];
                                                                setConfig({ ...config, resources: newRes });
                                                            }}
                                                            className="p-0.5 hover:bg-white/10 rounded text-zinc-600 disabled:opacity-0"
                                                        >
                                                            <ArrowUp size={10} />
                                                        </button>
                                                        <button
                                                            disabled={idx === config.resources.length - 1}
                                                            onClick={() => {
                                                                const newRes = [...config.resources];
                                                                [newRes[idx], newRes[idx + 1]] = [newRes[idx + 1], newRes[idx]];
                                                                setConfig({ ...config, resources: newRes });
                                                            }}
                                                            className="p-0.5 hover:bg-white/10 rounded text-zinc-600 disabled:opacity-0"
                                                        >
                                                            <ArrowDown size={10} />
                                                        </button>
                                                    </div>
                                                    <select
                                                        value={res.type}
                                                        onChange={(e) => {
                                                            const newRes = [...config.resources];
                                                            newRes[idx] = { ...newRes[idx], type: e.target.value as any };
                                                            setConfig({ ...config, resources: newRes });
                                                        }}
                                                        className="bg-zinc-800 text-[10px] px-2 py-1 rounded-md outline-none border border-white/5 font-mono uppercase text-zinc-400 hover:text-white transition-all cursor-pointer"
                                                    >
                                                        <option value="gallery">Gallery</option>
                                                        <option value="doc">Doc</option>
                                                        <option value="post">Post</option>
                                                    </select>
                                                </div>
                                                <button
                                                    onClick={() => setConfig({ ...config, resources: config.resources.filter(r => r.id !== res.id) })}
                                                    className="text-white/20 hover:text-red-500 transition-all opacity-40 group-hover:opacity-100 p-1"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                            <div className="space-y-2">
                                                <input
                                                    className="admin-input py-1.5 text-[10px] bg-zinc-900/50"
                                                    value={res.title}
                                                    onChange={(e) => {
                                                        const newRes = [...config.resources];
                                                        newRes[idx] = { ...newRes[idx], title: e.target.value };
                                                        setConfig({ ...config, resources: newRes });
                                                    }}
                                                    placeholder="TITLE"
                                                />
                                                <input
                                                    className="admin-input py-1.5 text-[10px] bg-zinc-900/50"
                                                    value={res.url}
                                                    onChange={(e) => {
                                                        const newRes = [...config.resources];
                                                        newRes[idx] = { ...newRes[idx], url: e.target.value };
                                                        setConfig({ ...config, resources: newRes });
                                                    }}
                                                    placeholder="SOURCE_URL"
                                                />
                                                {res.type === 'post' && (
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input
                                                            className="admin-input py-1.5 text-[10px] bg-zinc-900/50"
                                                            value={res.previewUrl || ''}
                                                            onChange={(e) => {
                                                                const newRes = [...config.resources];
                                                                newRes[idx] = { ...newRes[idx], previewUrl: e.target.value };
                                                                setConfig({ ...config, resources: newRes });
                                                            }}
                                                            placeholder="PREVIEW_IMG"
                                                        />
                                                        <input
                                                            className="admin-input py-1.5 text-[10px] bg-zinc-900/50"
                                                            value={res.meta || ''}
                                                            onChange={(e) => {
                                                                const newRes = [...config.resources];
                                                                newRes[idx] = { ...newRes[idx], meta: e.target.value };
                                                                setConfig({ ...config, resources: newRes });
                                                            }}
                                                            placeholder="META_TAG"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Gallery Settings (New) */}
                            <div className={cn("p-6 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-4", activeSection !== 'gallery' && 'hidden')}>
                                <div>
                                    <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 font-mono">
                                        <Camera size={16} className="text-zinc-500" /> Gallery
                                    </h2>
                                    <p className="mt-1 text-[10px] text-zinc-500">Images upload to R2. Videos upload to Mux, encode as adaptive HLS, then are ready to publish.</p>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <label className="group flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3 transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.035]">
                                        <span className="icon-surface size-10 shrink-0 text-zinc-400 transition-colors group-hover:text-white"><FileImage size={18} /></span>
                                        <span className="min-w-0 flex-1"><span className="block text-xs font-medium text-zinc-200">Upload image</span><span className="mt-0.5 block truncate font-mono text-[9px] uppercase tracking-[.1em] text-zinc-500">PNG · JPG · WebP · AVIF</span></span>
                                        <Upload size={15} className="shrink-0 text-zinc-600 transition-colors group-hover:text-white" />
                                        <input type="file" className="sr-only" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" onChange={(e) => handleFileUpload(e, 'gallery', 'image')} />
                                    </label>
                                    <label className="group flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3 transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.035]">
                                        <span className="icon-surface size-10 shrink-0 text-zinc-400 transition-colors group-hover:text-white"><FileVideo size={18} /></span>
                                        <span className="min-w-0 flex-1"><span className="block text-xs font-medium text-zinc-200">Upload MP4</span><span className="mt-0.5 block truncate font-mono text-[9px] uppercase tracking-[.1em] text-zinc-500">MP4 · WebM · OGG</span></span>
                                        <Upload size={15} className="shrink-0 text-zinc-600 transition-colors group-hover:text-white" />
                                        <input type="file" className="sr-only" accept="video/mp4,video/webm,video/ogg" onChange={(e) => handleFileUpload(e, 'gallery', 'video')} />
                                    </label>
                                </div>
                                {uploadingAsset?.target === 'gallery' && (
                                    <div className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3" role="status">
                                        <span className="icon-surface grid size-10 shrink-0 place-items-center border-emerald-400/20 bg-emerald-400/10 text-emerald-300"><LoaderCircle size={17} className="animate-spin" /></span>
                                        <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-zinc-100">{uploadingAsset.name}</span><span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[.1em] text-emerald-300">{uploadingAsset.target === 'gallery' ? 'Uploading to Mux' : 'Uploading to R2'} · {(uploadingAsset.size / 1024 / 1024).toFixed(2)} MB</span></span>
                                    </div>
                                )}
                                <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                                    {(config.gallery || []).map((item, idx) => (
                                        <div key={item.id} className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3 group hover:border-white/20 transition-all">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex flex-col gap-0.5">
                                                        <button
                                                            disabled={idx === 0}
                                                            onClick={() => {
                                                                const newGal = [...(config.gallery || [])];
                                                                [newGal[idx], newGal[idx - 1]] = [newGal[idx - 1], newGal[idx]];
                                                                setConfig({ ...config, gallery: newGal });
                                                            }}
                                                            className="p-0.5 hover:bg-white/10 rounded text-zinc-600 disabled:opacity-0"
                                                        >
                                                            <ArrowUp size={10} />
                                                        </button>
                                                        <button
                                                            disabled={idx === (config.gallery || []).length - 1}
                                                            onClick={() => {
                                                                const newGal = [...(config.gallery || [])];
                                                                [newGal[idx], newGal[idx + 1]] = [newGal[idx + 1], newGal[idx]];
                                                                setConfig({ ...config, gallery: newGal });
                                                            }}
                                                            className="p-0.5 hover:bg-white/10 rounded text-zinc-600 disabled:opacity-0"
                                                        >
                                                            <ArrowDown size={10} />
                                                        </button>
                                                    </div>
                                                    <span className="text-[10px] font-bold uppercase text-zinc-500">{item.type}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteGalleryItem(item.id, item.url)}
                                                    className="text-white/20 hover:text-red-500 transition-all opacity-40 group-hover:opacity-100 p-1"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                            {item.type === 'image' ? (
                                                <img src={item.url} className="w-full h-24 object-cover rounded-lg border border-white/5" alt={item.caption || 'Gallery item'} loading="lazy" decoding="async" />
                                            ) : (
                                                <video src={item.url} className="w-full h-24 object-cover rounded-lg border border-white/5" controls preload="none" />
                                            )}
                                            <input
                                                className="admin-input py-1.5 text-[10px] bg-zinc-900/50"
                                                value={item.caption || ''}
                                                onChange={(e) => {
                                                    const newGal = [...(config.gallery || [])];
                                                    newGal[idx] = { ...newGal[idx], caption: e.target.value };
                                                    setConfig({ ...config, gallery: newGal });
                                                }}
                                                placeholder="CAPTION / DESCRIPTION"
                                            />
                                            <input
                                                className="admin-input py-1.5 text-[10px] bg-zinc-900/50"
                                                value={item.url}
                                                onChange={(e) => {
                                                    const newGal = [...(config.gallery || [])];
                                                    newGal[idx] = { ...newGal[idx], url: e.target.value };
                                                    setConfig({ ...config, gallery: newGal });
                                                }}
                                                placeholder="URL"
                                            />
                                            {item.type === 'video' && <p className="text-[9px] leading-4 text-zinc-600">Mux videos use an adaptive <code>.m3u8</code> HLS playlist automatically. Existing direct MP4 and R2 HLS URLs remain supported.</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div></div>
                </div>

                    <div className="sticky bottom-3 z-30 mt-8 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#080808]/90 p-3 shadow-2xl backdrop-blur-xl supports-[backdrop-filter]:bg-[#080808]/75">
                        <span className="min-w-0 truncate px-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500" aria-live="polite">
                            {saveStatus || 'Profile settings'}
                        </span>
                        <button type="button" onClick={handleSave} disabled={isPending} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-white px-5 text-xs font-semibold text-black transition-colors hover:bg-zinc-200 disabled:cursor-wait disabled:opacity-60">
                            <Save size={14} /> {isPending ? 'Saving…' : 'Save changes'}
                        </button>
                    </div>
                </div>

                <style jsx global>{`
           .admin-input {
             width: 100%;
             padding: 0.75rem 1rem;
             background: rgba(0,0,0,0.6);
             border: 1px solid rgba(255,255,255,0.05);
             border-radius: 0.75rem;
             font-size: 0.8rem;
             font-family: var(--font-mono);
             outline: none;
             transition: all 0.2s;
             color: white;
           }
           .admin-input:focus {
             border-color: rgba(255,255,255,0.2);
             background: rgba(0,0,0,0.8);
           }
           .custom-scrollbar::-webkit-scrollbar {
             width: 4px;
           }
           .custom-scrollbar::-webkit-scrollbar-track {
             background: transparent;
           }
           .custom-scrollbar::-webkit-scrollbar-thumb {
             background: rgba(255,255,255,0.1);
             border-radius: 99px;
           }
         `}</style>


            </main>
        </>
    );
}
