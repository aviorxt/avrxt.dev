// Integrated into the existing avrxt-api-gateway; no browser credentials.
const musicInflight = new Map();
const musicArray = value => Array.isArray(value) ? value : value && typeof value === 'object' ? [value] : [];
const musicText = value => typeof value === 'string' ? value : value?.['#text'] || value?.name || '';
const musicNumber = value => Math.max(0, Number(value) || 0);
function musicUrl(value) {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; }
}
function musicImage(images) {
  return musicArray(images).map(item => musicUrl(item['#text'])).filter(url => url && !url.includes('2a96cbd8b46e442fc41c2b86b821562f')).pop() || '';
}
function musicTrack(track) {
  const artist = musicText(track.artist);
  const title = musicText(track.name);
  return { id: JSON.stringify([artist.toLowerCase(), title.toLowerCase()]), title, artist,
    album: musicText(track.album), image: musicImage(track.image),
    url: musicUrl(track.url), plays: musicNumber(track.playcount),
    playedAt: track.date?.uts ? new Date(Number(track.date.uts) * 1000).toISOString() : null };
}
async function musicApi(env, method, params = {}) {
  const url = new URL('https://ws.audioscrobbler.com/2.0/');
  url.search = new URLSearchParams({ method, user: env.LASTFM_USERNAME || 'avrxt', api_key: env.LASTFM_API_KEY, format: 'json', ...params }).toString();
  const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error('lastfm_unavailable');
  const data = await response.json();
  if (data.error) throw new Error('lastfm_error');
  return data;
}
// Cache is shared within each Cloudflare data centre, not globally. Coalesce
// simultaneous refreshes per isolate and back off after upstream errors.
async function musicCached(env, name, ttl, loader) {
  const username = env.LASTFM_USERNAME || 'avrxt';
  const key = new Request('https://api.avrxt.dev/__music_cache/v1/' + encodeURIComponent(username) + '/' + name);
  const cache = await caches.open('avrxt-muzix-v1');
  const saved = await cache.match(key);
  const cached = saved ? await saved.json() : null;
  const now = Date.now();
  if (cached && (now - cached.fetchedAt < ttl || cached.retryAt > now)) return cached;
  if (musicInflight.has(key.url)) return musicInflight.get(key.url);
  const refresh = (async () => {
    let entry;
    try { entry = { value: await loader(), fetchedAt: Date.now(), retryAt: 0 }; }
    catch {
      entry = { value: cached?.value ?? null, fetchedAt: cached?.fetchedAt || 0, retryAt: Date.now() + 30000 };
    }
    await cache.put(key, Response.json(entry, { headers: { 'Cache-Control': 'public, max-age=86400' } }));
    return entry;
  })();
  musicInflight.set(key.url, refresh);
  try { return await refresh; } finally { musicInflight.delete(key.url); }
}
function musicMonth(now = Date.now()) {
  const local = new Date(now + 19800000);
  const start = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) - 19800000;
  return { from: Math.floor(start / 1000), to: Math.floor(now / 1000),
    label: new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(now)) };
}
async function musicMonthStats(env, month) {
  let tracks = [], total = 0, pages = 1;
  const deadline = Date.now() + 12000;
  // Bound upstream work. Report incomplete coverage rather than invent totals.
  for (let page = 1; page <= Math.min(pages, 10); page++) {
    if (page > 1 && Date.now() > deadline) break;
    const data = await musicApi(env, 'user.getRecentTracks', { from: String(month.from), to: String(month.to), limit: '200', page: String(page) });
    if (!data.recenttracks) throw new Error('invalid_recenttracks');
    pages = Math.max(1, musicNumber(data.recenttracks['@attr']?.totalPages));
    total = musicNumber(data.recenttracks['@attr']?.total);
    tracks.push(...musicArray(data.recenttracks.track).filter(track => track['@attr']?.nowplaying !== 'true' && Number(track.date?.uts) >= month.from && Number(track.date?.uts) <= month.to).map(musicTrack));
  }
  const artists = new Map(), songs = new Map();
  for (const track of tracks) {
    artists.set(track.artist, (artists.get(track.artist) || 0) + 1);
    const current = songs.get(track.id);
    songs.set(track.id, { ...track, plays: (current?.plays || 0) + 1 });
  }
  return { label: month.label, timeZone: 'Asia/Kolkata', scrobbles: total, counted: tracks.length,
    complete: pages <= 10 && tracks.length >= total, uniqueArtists: artists.size,
    topArtist: [...artists].sort((a,b) => b[1] - a[1])[0]?.[0] || null,
    onLoop: [...songs.values()].sort((a,b) => b.plays - a.plays)[0] || null };
}
async function handleMuzix(request, env) {
  const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
  if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405, headers: { ...headers, Allow: 'GET' } });
  if (!env.LASTFM_API_KEY) return Response.json({ error: 'Listening feed is not configured.' }, { status: 503, headers });
  if (new URL(request.url).pathname === '/v1/music/artwork') return musicArtwork(request, env);
  if (new URL(request.url).pathname === '/v1/music/artist-image') return musicArtistImage(request, env);
  const recent = await musicCached(env, 'recent', 20000, async () => {
    const data = await musicApi(env, 'user.getRecentTracks', { limit: '50' });
    if (!data.recenttracks) throw new Error('invalid_recenttracks');
    return data.recenttracks;
  });
  if (!recent.value) return Response.json({ error: 'Last.fm is temporarily unavailable. Please try again shortly.' }, { status: 502, headers });
  const stale = Date.now() - recent.fetchedAt >= 60000 || recent.retryAt > 0;
  const raw = musicArray(recent.value.track);
  const recentTracks = raw.filter(track => track['@attr']?.nowplaying !== 'true' && track.date?.uts).map(musicTrack);
  const active = raw.find(track => track['@attr']?.nowplaying === 'true');
  const username = env.LASTFM_USERNAME || 'avrxt';
  const base = { source: 'lastfm', username, profileUrl: 'https://www.last.fm/user/' + encodeURIComponent(username),
    checkedAt: recent.fetchedAt, stale, nowPlaying: active && !stale ? musicTrack(active) : null, recentTracks };
  if (new URL(request.url).pathname === '/v1/music/now-playing') return Response.json(base, { headers });
  const month = musicMonth();
  const jobs = [
    ['artists', () => musicApi(env, 'user.getTopArtists', { period: '1month', limit: '6' })],
    ['tracks', () => musicApi(env, 'user.getTopTracks', { period: '1month', limit: '10' })],
    ['albums', () => musicApi(env, 'user.getTopAlbums', { period: '1month', limit: '6' })],
    ['profile', () => musicApi(env, 'user.getInfo')],
    ['month-' + month.from, () => musicMonthStats(env, month)]
  ];
  const entries = await Promise.all(jobs.map(([name, loader]) => musicCached(env, name, 900000, loader)));
  const [artists, tracks, albums, profile, capsule] = entries.map(entry => entry.value);
  return Response.json({ ...base, chartPeriod: 'Last 30 days',
    chartsUpdatedAt: Math.min(...entries.map(entry => entry.fetchedAt)),
    chartsStale: entries.some(entry => !entry.value || entry.retryAt > 0 || Date.now() - entry.fetchedAt >= 1800000),
    totalScrobbles: profile?.user ? musicNumber(profile.user.playcount) : null,
    topArtists: musicArray(artists?.topartists?.artist).map(artist => ({ name: artist.name, url: musicUrl(artist.url), image: musicImage(artist.image), plays: musicNumber(artist.playcount) })),
    topTracks: musicArray(tracks?.toptracks?.track).map(musicTrack),
    topAlbums: musicArray(albums?.topalbums?.album).map(album => ({ name: album.name, artist: musicText(album.artist), url: musicUrl(album.url), image: musicImage(album.image), plays: musicNumber(album.playcount) })),
    capsule: capsule || null
  }, { headers });
}

function musicNormalize(value, isTitle = false) {
  const text = isTitle ? String(value || '').replace(/\s*(?:[-�]\s*)?\(?from\s+.*$/i, '') : String(value || '');
  return text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');
}
function musicMatch(item, artist, title, album = false) {
  const name = album ? item.collectionName?.replace(/\s*[-–]\s*(single|ep)$/i, '') : item.trackName;
  const requested = album ? title.replace(/\s*[-–]\s*(single|ep)$/i, '') : title;
  const performer = musicNormalize(item.artistName);
  const wanted = musicNormalize(artist);
  return wanted.length >= 3 && performer.includes(wanted) && musicNormalize(name, true) === musicNormalize(requested, true);
}
async function musicArtwork(request, env) {
  const params = new URL(request.url).searchParams;
  const artist = params.get('artist')?.trim() || '';
  const title = params.get('track')?.trim() || '';
  const album = params.get('album')?.trim() || '';
  const albumOnly = params.get('type') === 'album';
  if (!artist || (!title && !album) || artist.length > 200 || title.length > 300 || album.length > 300) {
    return Response.json({ error: 'Invalid artwork query' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }
  const key = 'artwork-v4-' + encodeURIComponent(JSON.stringify([artist.toLowerCase(), albumOnly ? album.toLowerCase() : title.toLowerCase(), albumOnly]));
  const entry = await musicCached(env, key, 86400000, async () => {
    // Last.fm's recent/top lists often omit artwork that its detail API has.
    try {
      const data = albumOnly
        ? await musicApi(env, 'album.getInfo', { artist, album, autocorrect: '0' })
        : await musicApi(env, 'track.getInfo', { artist, track: title, autocorrect: '0' });
      const detail = albumOnly ? data.album : data.track?.album;
      const image = musicImage(detail?.image);
      if (image) return { image, source: 'lastfm', sourceUrl: musicUrl(detail.url || data.track?.url) };
    } catch { /* Try a verified catalogue match instead. */ }
    const search = new URL('https://itunes.apple.com/search');
    search.search = new URLSearchParams({ term: artist + ' ' + (albumOnly ? album : title), media: 'music', entity: albumOnly ? 'album' : 'song', country: 'IN', limit: '10' }).toString();
    try {
      const response = await fetch(search, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(5000) });
      if (!response.ok) return { image: '', source: null, sourceUrl: '', clientLookup: true };
      const data = await response.json();
      const match = musicArray(data.results).find(item => musicMatch(item, artist, albumOnly ? album : title, albumOnly));
      if (match) {
        const image = musicUrl(match.artworkUrl100);
        const link = musicUrl(albumOnly ? match.collectionViewUrl : match.trackViewUrl);
        if (image && new URL(image).hostname.endsWith('.mzstatic.com') && link && /(^|\.)apple\.com$/.test(new URL(link).hostname)) {
          return { image: image.replace(/\/100x100bb\./, '/600x600bb.'), source: 'apple', sourceUrl: link };
        }
      }
    } catch { return { image: '', source: null, sourceUrl: '', clientLookup: true }; }
    return { image: '', source: null, sourceUrl: '' };
  });
  return Response.json(entry.value || { image: '', source: null, sourceUrl: '' }, { headers: { 'Cache-Control': 'private, no-store' } });
}
async function musicArtistImage(request, env) {
  const artist = new URL(request.url).searchParams.get('artist')?.trim() || '';
  if (!artist || artist.length > 200) return Response.json({ error: 'Invalid artist' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  const entry = await musicCached(env, 'artist-deezer-v1-' + encodeURIComponent(musicNormalize(artist)), 86400000, async () => {
    const url = new URL('https://api.deezer.com/search/artist');
    url.search = new URLSearchParams({ q: artist, limit: '10' }).toString();
    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(6000) });
    if (!response.ok) throw new Error('artist_catalogue_unavailable');
    const data = await response.json();
    if (data.error) throw new Error('artist_catalogue_unavailable');
    const candidates = musicArray(data.data).filter(item => musicNormalize(item.name) === musicNormalize(artist))
      .sort((a,b) => musicNumber(b.nb_fan) - musicNumber(a.nb_fan));
    for (const match of candidates) {
      const image = musicUrl(match.picture_big || match.picture_medium);
      const link = musicUrl(match.link);
      if (image && new URL(image).hostname === 'cdn-images.dzcdn.net' && /\/images\/artist\/[a-f0-9]{32}\//.test(new URL(image).pathname)
        && link && /(^|\.)deezer\.com$/.test(new URL(link).hostname)) {
        return { image, source: 'deezer', sourceUrl: link };
      }
    }
    return { image: '', source: null, sourceUrl: '' };
  });
  return Response.json(entry.value || { image: '', source: null, sourceUrl: '' }, { headers: { 'Cache-Control': 'private, no-store' } });
}
export { handleMuzix, musicMonth, musicMatch };
