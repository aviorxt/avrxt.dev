import { getSpotifyTokens, refreshAccessToken } from '@/lib/spotify';

const API = 'https://api.spotify.com/v1';

type SpotifyImage = { url?: string };
type SpotifyArtist = { id?: string; name?: string; images?: SpotifyImage[]; external_urls?: { spotify?: string }; genres?: string[] };
type SpotifyTrack = {
  id?: string;
  name?: string;
  duration_ms?: number;
  external_urls?: { spotify?: string };
  artists?: SpotifyArtist[];
  album?: { name?: string; images?: SpotifyImage[] };
};

export type ChartTrack = {
  id: string;
  title: string;
  artist: string;
  album: string;
  image: string;
  url: string;
  durationMs: number;
};

export type ChartArtist = {
  id: string;
  name: string;
  image: string;
  url: string;
  genres: string[];
};

export type MuzixChart = {
  connected: boolean;
  generatedAt: number;
  permissionsRequired: boolean;
  nowPlaying: (ChartTrack & { isPlaying: boolean; progressMs: number; repeatState: string; shuffle: boolean; contextUrl: string; contextName: string }) | null;
  topArtists: ChartArtist[];
  topTracks: ChartTrack[];
  recentTracks: Array<ChartTrack & { playedAt: string }>;
  onLoop: (ChartTrack & { recentPlays: number }) | null;
  likedSongs: number | null;
  playlists: Array<{ id: string; name: string; image: string; url: string; tracks: number }>;
  capsule: {
    label: string;
    topArtist: string | null;
    topTrack: string | null;
    leadingGenre: string | null;
    uniqueRecentArtists: number;
  };
};

function track(item?: SpotifyTrack | null): ChartTrack | null {
  if (!item?.id || !item.name) return null;
  return {
    id: item.id,
    title: item.name,
    artist: item.artists?.map((artist) => artist.name).filter(Boolean).join(', ') || 'Unknown artist',
    album: item.album?.name || 'Unknown album',
    image: item.album?.images?.[0]?.url || '',
    url: item.external_urls?.spotify || '',
    durationMs: item.duration_ms || 0,
  };
}

function artist(item?: SpotifyArtist | null): ChartArtist | null {
  if (!item?.id || !item.name) return null;
  return {
    id: item.id,
    name: item.name,
    image: item.images?.[0]?.url || '',
    url: item.external_urls?.spotify || '',
    genres: item.genres?.slice(0, 3) || [],
  };
}

async function validAccessToken() {
  const tokens = await getSpotifyTokens();
  if (!tokens) return null;
  const expiresAt = new Date(tokens.expires_at).getTime();
  return Date.now() > expiresAt - 60_000
    ? refreshAccessToken(tokens.refresh_token)
    : tokens.access_token as string;
}

async function spotifyJson<T>(accessToken: string, path: string): Promise<T | null> {
  const response = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (response.status === 204) return null;
  if (!response.ok) return null;
  return response.json() as Promise<T>;
}

export async function getMuzixChart(): Promise<MuzixChart> {
  const empty: MuzixChart = {
    connected: false,
    generatedAt: Date.now(),
    permissionsRequired: false,
    nowPlaying: null,
    topArtists: [],
    topTracks: [],
    recentTracks: [],
    onLoop: null,
    likedSongs: null,
    playlists: [],
    capsule: { label: 'Last 4 weeks', topArtist: null, topTrack: null, leadingGenre: null, uniqueRecentArtists: 0 },
  };
  let accessToken: string | null = null;
  try {
    accessToken = await validAccessToken();
  } catch {
    return empty;
  }
  if (!accessToken) return empty;

  const [playback, topArtistData, topTrackData, recentData, likedData, playlistData] = await Promise.all([
    spotifyJson<{ is_playing?: boolean; progress_ms?: number; repeat_state?: string; shuffle_state?: boolean; item?: SpotifyTrack; context?: { external_urls?: { spotify?: string } } }>(accessToken, '/me/player?additional_types=track'),
    spotifyJson<{ items?: SpotifyArtist[] }>(accessToken, '/me/top/artists?time_range=short_term&limit=6'),
    spotifyJson<{ items?: SpotifyTrack[] }>(accessToken, '/me/top/tracks?time_range=short_term&limit=8'),
    spotifyJson<{ items?: Array<{ track?: SpotifyTrack; played_at?: string }> }>(accessToken, '/me/player/recently-played?limit=50'),
    spotifyJson<{ total?: number }>(accessToken, '/me/tracks?limit=1'),
    spotifyJson<{ items?: Array<{ id?: string; name?: string; public?: boolean; images?: SpotifyImage[]; external_urls?: { spotify?: string }; tracks?: { total?: number }; items?: { total?: number } }> }>(accessToken, '/me/playlists?limit=20'),
  ]);

  const nowTrack = track(playback?.item);
  const topArtists = (topArtistData?.items || []).map(artist).filter((item): item is ChartArtist => Boolean(item));
  const topTracks = (topTrackData?.items || []).map(track).filter((item): item is ChartTrack => Boolean(item));
  const recentTracks = (recentData?.items || []).flatMap((item) => {
    const normalized = track(item.track);
    return normalized ? [{ ...normalized, playedAt: item.played_at || '' }] : [];
  });

  const frequency = new Map<string, { item: ChartTrack; count: number }>();
  recentTracks.forEach((item) => {
    const current = frequency.get(item.id);
    frequency.set(item.id, { item, count: (current?.count || 0) + 1 });
  });
  const loopSignal = [...frequency.values()].sort((a, b) => b.count - a.count)[0];
  const onLoopBase = loopSignal?.item || topTracks[0] || null;

  const genres = topArtists.flatMap((item) => item.genres);
  const leadingGenre = genres.length
    ? [...new Set(genres)].sort((a, b) => genres.filter((genre) => genre === b).length - genres.filter((genre) => genre === a).length)[0]
    : null;

  const publicPlaylists = (playlistData?.items || [])
    .filter((item) => item.public !== false && item.id && item.name)
    .slice(0, 6)
    .map((item) => ({
      id: item.id!,
      name: item.name!,
      image: item.images?.[0]?.url || '',
      url: item.external_urls?.spotify || '',
      tracks: item.tracks?.total ?? item.items?.total ?? 0,
    }));
  const activePlaylist = publicPlaylists.find((playlist) => playlist.url === playback?.context?.external_urls?.spotify);

  return {
    connected: true,
    generatedAt: Date.now(),
    permissionsRequired: !topArtistData || !topTrackData || !likedData || !playlistData,
    nowPlaying: nowTrack ? {
      ...nowTrack,
      isPlaying: Boolean(playback?.is_playing),
      progressMs: playback?.progress_ms || 0,
      repeatState: playback?.repeat_state || 'off',
      shuffle: Boolean(playback?.shuffle_state),
      contextUrl: playback?.context?.external_urls?.spotify || '',
      contextName: activePlaylist?.name || (playback?.context ? 'Spotify context' : 'No active playlist'),
    } : null,
    topArtists,
    topTracks,
    recentTracks: recentTracks.slice(0, 10),
    onLoop: onLoopBase ? { ...onLoopBase, recentPlays: loopSignal?.count || 0 } : null,
    likedSongs: typeof likedData?.total === 'number' ? likedData.total : null,
    playlists: publicPlaylists,
    capsule: {
      label: 'Last 4 weeks',
      topArtist: topArtists[0]?.name || null,
      topTrack: topTracks[0]?.title || null,
      leadingGenre,
      uniqueRecentArtists: new Set(recentTracks.flatMap((item) => item.artist.split(', '))).size,
    },
  };
}
