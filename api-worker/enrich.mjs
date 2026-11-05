import {musicMatch} from './lastfm.mjs';
export function validImage(value){try{const u=new URL(value);return u.protocol==='https:'&&/(^|\.)(lastfm\.freetls\.fastly\.net|lastfm-img2\.akamaized\.net|mzstatic\.com|dzcdn\.net)$/.test(u.hostname)&&!u.pathname.includes('2a96cbd8b46e442fc41c2b86b821562f')?u.href:'';}catch{return '';}}
export function listeningTime(tracks,total){
  let milliseconds=0,coveredPlays=0;
  for(const track of tracks){if(Number.isFinite(track.durationMs)&&track.durationMs>0&&track.durationMs<=86400000){milliseconds+=track.durationMs*track.plays;coveredPlays+=track.plays;}}
  return {milliseconds,coveredPlays,totalPlays:total,coverage:total?Math.round(coveredPlays/total*100):100,complete:coveredPlays===total,estimated:true};
}
export async function enrichSnapshot(snapshot,{key,fetcher=fetch,pause=ms=>new Promise(r=>setTimeout(r,ms)),maxTracks=500}={}){
  const all=(snapshot.trackCatalog||snapshot.tracks).map(x=>({...x,image:validImage(x.image)}));
  // Two spaced metadata reads per second, with a finite budget. Unknown lengths
  // remain unknown; no average song duration is invented.
  const deadline=Date.now()+240000;
  for(const track of all.slice(0,maxTracks)){
    if(Date.now()>deadline)break;
    try{
      const url=new URL('https://ws.audioscrobbler.com/2.0/');url.search=new URLSearchParams({method:'track.getInfo',artist:track.artist,track:track.title,api_key:key,format:'json',autocorrect:'0'}).toString();
      const response=await fetcher(url,{signal:AbortSignal.timeout(7000)});const data=response.ok?await response.json():{};
      if(data.track&&musicMatch({artistName:data.track.artist?.name,trackName:data.track.name},track.artist,track.title)){
        const duration=Number(data.track.duration);if(duration>0&&duration<=86400000)track.durationMs=duration;
        if(!track.image)track.image=(data.track.album?.image||[]).map(x=>validImage(x['#text'])).filter(Boolean).at(-1)||'';
      }
    }catch{/* Metadata is optional and its coverage is shown in the email. */}
    await pause(500);
  }
  let appleReads=0;
  async function artwork(item,album=false){
    item.image=validImage(item.image);if(item.image)return item;
    try{const params=new URLSearchParams({artist:item.artist,...(album?{album:item.name,type:'album'}:{track:item.title})});const response=await fetcher('https://api.avrxt.dev/v1/music/artwork?'+params,{signal:AbortSignal.timeout(10000)});if(response.ok){const data=await response.json();item.image=validImage(data.image);if(item.image){item.imageSource=data.source;item.imageSourceUrl=data.sourceUrl;}}}catch{/* Try the public catalogue below. */}
    if(!item.image&&appleReads<18){
      appleReads++;await pause(3200);
      try{const params=new URLSearchParams({term:item.artist+' '+(album?item.name:item.title),media:'music',entity:album?'album':'song',country:'IN',limit:'20'});const response=await fetcher('https://itunes.apple.com/search?'+params,{signal:AbortSignal.timeout(8000)});const data=response.ok?await response.json():{};const match=data.results?.find(x=>musicMatch(x,item.artist,album?item.name:item.title,album));if(match){item.image=validImage(match.artworkUrl100?.replace('/100x100bb.','/600x600bb.'));if(item.image){item.imageSource='apple';item.imageSourceUrl=album?match.collectionViewUrl:match.trackViewUrl;}if(!album&&Number(match.trackTimeMillis)>0)item.durationMs=Number(match.trackTimeMillis);}}catch{/* Retain neutral artwork and explicit missing duration. */}
    }
    return item;
  }
  const tracks=[];for(const track of all.slice(0,10))tracks.push(await artwork(track));
  const albums=[];for(const album of snapshot.albums)albums.push(await artwork({...album},true));
  const artists=[];for(const artist of snapshot.artists){const item={...artist,image:''};try{const response=await fetcher('https://api.avrxt.dev/v1/music/artist-image?'+new URLSearchParams({artist:item.name}),{signal:AbortSignal.timeout(8000)});if(response.ok){const data=await response.json();item.image=validImage(data.image);item.imageSource=data.source;item.imageSourceUrl=data.sourceUrl;}}catch{/* Try the catalogue directly from the workflow below. */}
    if(!item.image){try{const response=await fetcher('https://api.deezer.com/search/artist?'+new URLSearchParams({q:item.name,limit:'10'}),{signal:AbortSignal.timeout(7000)});const data=response.ok?await response.json():{};const normalize=value=>String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');const match=data.data?.filter(x=>normalize(x.name)===normalize(item.name)).sort((a,b)=>(b.nb_fan||0)-(a.nb_fan||0))[0];if(match){item.image=validImage(match.picture_big||match.picture_medium);if(item.image){item.imageSource='deezer';item.imageSourceUrl=match.link;}}}catch{/* Retain initials for unmatched artists. */}}
    artists.push(item);await pause(150);}
  return {...snapshot,trackCatalog:undefined,tracks,albums,artists,onLoop:tracks[0]||null,playtime:listeningTime(all,snapshot.scrobbles)};
}
