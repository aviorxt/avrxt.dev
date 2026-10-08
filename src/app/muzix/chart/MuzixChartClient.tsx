'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Disc3, Heart, History, ListMusic, LoaderCircle, Pause, Play, Radio, RefreshCw, Repeat2, Shuffle, Sparkles, TrendingUp, Waves } from 'lucide-react';
import { SiSpotify } from 'react-icons/si';
import type { ChartArtist, ChartTrack, MuzixChart } from '@/lib/spotify-chart';

function Art({ image, label, className = '' }: { image?: string; label: string; className?: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      className={`block shrink-0 bg-[#121212] bg-cover bg-center ${className}`}
      style={image ? { backgroundImage: `linear-gradient(rgba(0,0,0,.04),rgba(0,0,0,.16)),url("${image.replace(/"/g, '%22')}")` } : undefined}
    >
      {!image && <span className="grid size-full place-items-center"><Disc3 className="size-1/3 text-[#484848]" /></span>}
    </span>
  );
}

function ExternalTrack({ item, rank }: { item: ChartTrack; rank: number }) {
  return (
    <a href={item.url || undefined} target={item.url ? '_blank' : undefined} rel="noreferrer" className="muzix-row group grid grid-cols-[2rem_3rem_1fr_auto] items-center gap-3 border-b border-[#1F1F1F] px-4 py-3.5 transition-colors hover:bg-white/[.025] sm:grid-cols-[2.5rem_3.25rem_1fr_auto] sm:px-5">
      <span className="font-mono text-[9px] text-[#666666]">{String(rank).padStart(2, '0')}</span>
      <Art image={item.image} label={`${item.album} cover`} className="size-12 border border-[#292929] sm:size-[3.25rem]" />
      <span className="min-w-0"><strong className="block truncate text-sm font-medium text-[#F7F7F7]">{item.title}</strong><span className="mt-1 block truncate text-xs text-[#858585]">{item.artist}</span></span>
      <ArrowUpRight size={13} className="text-[#484848] transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
    </a>
  );
}

function ArtistCard({ item, rank }: { item: ChartArtist; rank: number }) {
  return (
    <a href={item.url || undefined} target={item.url ? '_blank' : undefined} rel="noreferrer" className="muzix-artist group min-w-0 border border-[#1F1F1F] bg-[#080808] p-3 transition-colors hover:border-[#484848] hover:bg-[#0b0b0b]">
      <div className="relative overflow-hidden"><Art image={item.image} label={`${item.name} portrait`} className="aspect-square w-full transition-transform duration-500 group-hover:scale-[1.025]" /><span className="absolute left-2 top-2 border border-white/15 bg-black/70 px-2 py-1 font-mono text-[8px] text-white backdrop-blur-md">#{rank}</span></div>
      <div className="mt-3 flex items-start justify-between gap-2"><div className="min-w-0"><h3 className="truncate text-sm font-semibold">{item.name}</h3><p className="mt-1 truncate font-mono text-[7px] uppercase tracking-[.12em] text-[#666666]">{item.genres[0] || 'Artist'}</p></div><ArrowUpRight size={12} className="mt-1 shrink-0 text-[#484848] group-hover:text-white" /></div>
    </a>
  );
}

function EmptyState({ error }: { error: string }) {
  return (
    <section className="mx-auto grid min-h-[62svh] max-w-4xl place-items-center px-4 py-32 text-center">
      <div><span className="mx-auto grid size-16 place-items-center rounded-full border border-[#292929] bg-[#080808]"><Radio className="size-6 text-[#858585]" /></span><p className="mt-6 font-mono text-[9px] uppercase tracking-[.26em] text-[#666666]">Spotify signal unavailable</p><h1 className="mt-3 text-4xl font-semibold sm:text-6xl">Muzix is between tracks.</h1><p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#858585]">{error}</p></div>
    </section>
  );
}

export default function MuzixChartClient() {
  const [data, setData] = useState<MuzixChart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('The Spotify account is not connected yet.');
  const [clock, setClock] = useState(0);
  const [capsuleMonth, setCapsuleMonth] = useState('Current month');

  const load = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const response = await fetch('/api/spotify/chart', { cache: 'no-store' });
      const payload = await response.json() as MuzixChart & { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Music data is temporarily unavailable.');
      setData(payload);
      setError('The Spotify account is not connected yet.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Music data is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setClock(Date.now());
    setCapsuleMonth(new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date()));
    void load();
    const refresh = window.setInterval(() => void load(true), 30_000);
    const ticker = window.setInterval(() => setClock(Date.now()), 1_000);
    return () => { window.clearInterval(refresh); window.clearInterval(ticker); };
  }, []);

  const progress = useMemo(() => {
    if (!data?.nowPlaying?.durationMs) return 0;
    const elapsed = data.nowPlaying.isPlaying ? Math.max(0, clock - data.generatedAt) : 0;
    return Math.min(100, ((data.nowPlaying.progressMs + elapsed) / data.nowPlaying.durationMs) * 100);
  }, [clock, data]);

  if (loading && !data) return <main className="grid min-h-screen place-items-center bg-[#050505] px-4 text-white"><div className="text-center"><LoaderCircle className="mx-auto size-6 animate-spin text-[#858585]" /><h1 className="mt-5 font-outfit text-4xl font-semibold tracking-[-.05em] sm:text-6xl">Muzix chart</h1><p className="mt-4 font-mono text-[8px] uppercase tracking-[.25em] text-[#666666]">Tuning Spotify signal</p></div></main>;
  if (!data?.connected) return <main className="min-h-screen bg-[#050505]"><EmptyState error={error} /></main>;

  const now = data.nowPlaying;
  const loop = data.onLoop;

  return (
    <main className="muzix-page relative min-h-screen overflow-x-clip bg-[#050505] px-4 pb-24 pt-28 text-white sm:px-6 sm:pb-32 sm:pt-36">
      <div className="muzix-ambient pointer-events-none absolute inset-x-0 top-0 h-[58rem]" />
      <div className="relative mx-auto max-w-6xl">
        <header className="border-b border-[#1F1F1F] pb-12 sm:pb-16">
          <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-[8px] uppercase tracking-[.2em] text-[#858585]"><span className="inline-flex items-center gap-2"><span className={`size-1.5 rounded-full ${now?.isPlaying ? 'muzix-live bg-white' : 'bg-[#484848]'}`} /> {now?.isPlaying ? 'Live Spotify signal' : 'Playback idle'}</span><button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-10 items-center gap-2 border border-[#292929] bg-black px-3 transition-colors hover:border-[#666666] hover:text-white disabled:opacity-50"><RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Refresh chart</button></div>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="font-mono text-[9px] uppercase tracking-[.3em] text-[#666666]">/muzix/chart — listening telemetry</p><h1 className="mt-5 font-outfit text-[clamp(4rem,13vw,9.5rem)] font-semibold uppercase leading-[.72] tracking-[-.085em]">Muzix<br /><span className="muzix-outline">chart.</span></h1></div><p className="max-w-sm border-l border-[#333333] pl-5 text-sm leading-7 text-[#A3A3A3]">A live view of what is playing, what stays in rotation, and the artists shaping this month&apos;s signal.</p></div>
        </header>

        {data.permissionsRequired && <div className="mt-5 flex items-start gap-3 border border-[#333333] bg-[#080808] p-4 text-xs leading-6 text-[#A3A3A3]"><Sparkles size={14} className="mt-1 shrink-0 text-white" /><p>Spotify is connected with older permissions. Reconnect it once from the admin profile to unlock top artists, liked-song totals, public playlists, and the full monthly capsule.</p></div>}

        <section aria-labelledby="now-playing-heading" className="grid gap-4 py-12 lg:grid-cols-[1.45fr_.55fr]">
          <article className="muzix-now relative overflow-hidden border border-[#292929] bg-[#080808] p-5 sm:p-7">
            {now?.image && <div className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[.08] blur-3xl scale-110" style={{ backgroundImage: `url("${now.image.replace(/"/g, '%22')}")` }} />}
            <div className="relative grid gap-6 sm:grid-cols-[11rem_1fr] sm:items-center">
              <Art image={now?.image} label={now ? `${now.album} cover` : 'No track cover'} className="aspect-square w-full border border-[#333333] sm:w-44" />
              <div className="min-w-0"><div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[.2em] text-[#858585]"><SiSpotify size={13} /> <span id="now-playing-heading">{now?.isPlaying ? 'Now playing' : 'Last playback state'}</span></div><h2 className="mt-4 truncate text-3xl font-semibold sm:text-4xl">{now?.title || 'No active track'}</h2><p className="mt-2 truncate text-sm text-[#A3A3A3]">{now?.artist || 'Spotify is currently quiet'}</p><p className="mt-1 truncate text-xs text-[#666666]">{now?.album || 'Waiting for the next signal'}</p>
                <div className="mt-6 h-px overflow-hidden bg-[#292929]"><div className="h-full bg-white transition-[width] duration-1000 ease-linear" style={{ width: `${progress}%` }} /></div>
                <div className="mt-4 flex flex-wrap items-center gap-2"><span className="grid size-9 place-items-center rounded-full border border-[#484848] bg-white text-black">{now?.isPlaying ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}</span><span className="inline-flex h-9 items-center gap-2 border border-[#292929] px-3 font-mono text-[8px] uppercase tracking-[.14em] text-[#858585]"><Repeat2 size={11} /> {now?.repeatState || 'off'}</span><span className="inline-flex h-9 items-center gap-2 border border-[#292929] px-3 font-mono text-[8px] uppercase tracking-[.14em] text-[#858585]"><Shuffle size={11} /> {now?.shuffle ? 'On' : 'Off'}</span>{now?.url && <a href={now.url} target="_blank" rel="noreferrer" className="ml-auto inline-flex h-9 items-center gap-2 font-mono text-[8px] uppercase tracking-[.14em] text-[#BCBCBC] hover:text-white">Open Spotify <ArrowUpRight size={12} /></a>}</div>
              </div>
            </div>
          </article>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <article className="border border-[#1F1F1F] bg-black p-5"><div className="flex items-center justify-between"><span className="grid size-10 place-items-center border border-[#292929] bg-[#080808]"><ListMusic size={16} /></span><span className="font-mono text-[8px] uppercase tracking-[.16em] text-[#666666]">Active context</span></div><h2 className="mt-7 text-xl font-semibold">{now?.contextName || 'No playlist active'}</h2><p className="mt-2 text-xs leading-5 text-[#686868]">{now?.contextUrl ? 'Current Spotify playlist or playback context.' : 'Start a playlist to populate this signal.'}</p>{now?.contextUrl && <a href={now.contextUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 font-mono text-[8px] uppercase tracking-[.15em] text-[#BCBCBC] hover:text-white">View context <ArrowUpRight size={11} /></a>}</article>
            <article className="border border-[#1F1F1F] bg-black p-5"><div className="flex items-center justify-between"><span className="grid size-10 place-items-center border border-[#292929] bg-[#080808]"><Heart size={16} /></span><span className="font-mono text-[8px] uppercase tracking-[.16em] text-[#666666]">Library</span></div><p className="mt-7 font-outfit text-5xl font-semibold tracking-[-.06em]">{data.likedSongs?.toLocaleString() ?? '—'}</p><p className="mt-2 font-mono text-[8px] uppercase tracking-[.16em] text-[#858585]">Liked songs</p></article>
          </div>
        </section>

        <section className="grid gap-4 border-y border-[#1F1F1F] py-12 lg:grid-cols-[.8fr_1.2fr]">
          <article className="muzix-capsule relative overflow-hidden border border-[#292929] bg-[#080808] p-6 sm:p-8"><div className="relative"><div className="flex items-center justify-between"><span className="inline-flex items-center gap-2 font-mono text-[8px] uppercase tracking-[.2em] text-[#A3A3A3]"><Waves size={13} /> Monthly music capsule</span><span className="font-mono text-[8px] uppercase tracking-[.16em] text-[#666666]">{data.capsule.label}</span></div><h2 className="mt-12 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">{capsuleMonth}</h2><div className="mt-10 grid gap-px border border-[#292929] bg-[#292929] sm:grid-cols-2"><div className="bg-black p-4"><p className="font-mono text-[7px] uppercase tracking-[.18em] text-[#666666]">Top artist</p><p className="mt-2 truncate text-sm font-medium">{data.capsule.topArtist || 'Awaiting signal'}</p></div><div className="bg-black p-4"><p className="font-mono text-[7px] uppercase tracking-[.18em] text-[#666666]">Top track</p><p className="mt-2 truncate text-sm font-medium">{data.capsule.topTrack || 'Awaiting signal'}</p></div><div className="bg-black p-4"><p className="font-mono text-[7px] uppercase tracking-[.18em] text-[#666666]">Leading genre</p><p className="mt-2 truncate text-sm font-medium capitalize">{data.capsule.leadingGenre || 'Unclassified'}</p></div><div className="bg-black p-4"><p className="font-mono text-[7px] uppercase tracking-[.18em] text-[#666666]">Recent artists</p><p className="mt-2 text-sm font-medium">{data.capsule.uniqueRecentArtists || '—'} unique</p></div></div></div></article>
          <article className="border border-[#292929] bg-black p-5 sm:p-7"><div className="flex items-center justify-between"><div><p className="font-mono text-[8px] uppercase tracking-[.2em] text-[#666666]">Repeat signal</p><h2 className="mt-2 text-2xl font-semibold">On loop</h2></div><Repeat2 className="text-[#858585]" size={20} /></div>{loop ? <a href={loop.url || undefined} target={loop.url ? '_blank' : undefined} rel="noreferrer" className="group mt-8 grid gap-5 sm:grid-cols-[8rem_1fr] sm:items-center"><Art image={loop.image} label={`${loop.album} cover`} className="aspect-square w-full border border-[#292929] sm:w-32" /><div className="min-w-0"><p className="font-mono text-[8px] uppercase tracking-[.18em] text-[#666666]">{loop.recentPlays > 1 ? `${loop.recentPlays} plays in recent history` : 'Top short-term affinity'}</p><h3 className="mt-3 truncate text-2xl font-semibold">{loop.title}</h3><p className="mt-2 truncate text-sm text-[#858585]">{loop.artist}</p><span className="mt-5 inline-flex items-center gap-2 font-mono text-[8px] uppercase tracking-[.15em] text-[#BCBCBC] group-hover:text-white">Listen on Spotify <ArrowUpRight size={11} /></span></div></a> : <p className="mt-8 text-sm text-[#686868]">No repeat signal is available yet.</p>}</article>
        </section>

        <section aria-labelledby="top-artists-heading" className="py-12"><div className="mb-7 flex items-end justify-between gap-5"><div><p className="font-mono text-[8px] uppercase tracking-[.22em] text-[#666666]">Four-week affinity</p><h2 id="top-artists-heading" className="mt-2 text-3xl font-semibold sm:text-4xl">Top artists</h2></div><TrendingUp size={18} className="text-[#858585]" /></div>{data.topArtists.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{data.topArtists.map((item, index) => <ArtistCard key={item.id} item={item} rank={index + 1} />)}</div> : <div className="border border-[#1F1F1F] p-8 text-sm text-[#686868]">Reconnect Spotify to unlock top artists.</div>}</section>

        <section className="grid gap-4 border-t border-[#1F1F1F] py-12 lg:grid-cols-[1.15fr_.85fr]">
          <article className="overflow-hidden border border-[#1F1F1F] bg-black"><header className="flex items-center justify-between border-b border-[#1F1F1F] p-5"><div><p className="font-mono text-[8px] uppercase tracking-[.2em] text-[#666666]">Chart / Short term</p><h2 className="mt-2 text-2xl font-semibold">Top songs</h2></div><Disc3 size={20} className="text-[#858585]" /></header>{data.topTracks.length ? data.topTracks.map((item, index) => <ExternalTrack key={item.id} item={item} rank={index + 1} />) : <p className="p-6 text-sm text-[#686868]">No top-track signal yet.</p>}</article>
          <article className="overflow-hidden border border-[#1F1F1F] bg-black"><header className="flex items-center justify-between border-b border-[#1F1F1F] p-5"><div><p className="font-mono text-[8px] uppercase tracking-[.2em] text-[#666666]">Rotation / Latest</p><h2 className="mt-2 text-2xl font-semibold">Recently played</h2></div><History size={18} className="text-[#858585]" /></header>{data.recentTracks.length ? data.recentTracks.slice(0, 8).map((item, index) => <ExternalTrack key={`${item.id}-${item.playedAt}`} item={item} rank={index + 1} />) : <p className="p-6 text-sm text-[#686868]">Recent tracks will appear after playback.</p>}</article>
        </section>

        <section aria-labelledby="playlists-heading" className="border-t border-[#1F1F1F] pt-12"><div className="mb-7"><p className="font-mono text-[8px] uppercase tracking-[.22em] text-[#666666]">Public collection</p><h2 id="playlists-heading" className="mt-2 text-3xl font-semibold sm:text-4xl">Playlists</h2></div>{data.playlists.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data.playlists.map((playlist) => <a key={playlist.id} href={playlist.url} target="_blank" rel="noreferrer" className="group grid grid-cols-[5rem_1fr_auto] items-center gap-4 border border-[#1F1F1F] bg-[#080808] p-3 transition-colors hover:border-[#484848]"><Art image={playlist.image} label={`${playlist.name} cover`} className="size-20 border border-[#292929]" /><span className="min-w-0"><strong className="block truncate text-sm">{playlist.name}</strong><span className="mt-2 block font-mono text-[8px] uppercase tracking-[.14em] text-[#666666]">{playlist.tracks} tracks</span></span><ArrowUpRight size={13} className="mr-2 text-[#484848] group-hover:text-white" /></a>)}</div> : <div className="border border-[#1F1F1F] p-8 text-sm text-[#686868]">No public playlists are available.</div>}</section>

        <footer className="mt-12 flex flex-col gap-4 border-t border-[#1F1F1F] pt-6 font-mono text-[8px] uppercase tracking-[.16em] text-[#666666] sm:flex-row sm:items-center sm:justify-between"><span>Data supplied by Spotify Web API</span><span>Updated {new Date(data.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></footer>
      </div>
    </main>
  );
}
