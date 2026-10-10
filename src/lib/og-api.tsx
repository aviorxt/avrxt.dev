import { ImageResponse } from 'next/og';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import { getOgFonts } from '@/app/_og/fonts';
import { getTool, tools } from '@/lib/tool-catalog';

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

type Motif = 'identity' | 'signature' | 'contact' | 'gallery' | 'tools' | 'docs' | 'music' | 'legal' | 'security';
type OgCard = { eyebrow: string; title: string; description: string; motif: Motif; index: string; chips: string[] };

const card = (eyebrow: string, title: string, description: string, motif: Motif, index: string, chips: string[]): OgCard =>
  ({ eyebrow, title, description, motif, index, chips });

const ROUTES: Record<string, OgCard> = {
  '/': card('Independent developer · India', 'Ideas, systems & useful digital tools.', 'The personal web home of avrxt — also known as aviorxt.', 'identity', '00', ['DEVELOPMENT', 'AVIATION', 'EXPERIMENTS']),
  '/about': card('About avrxt', 'Developer by craft. Aircraft engineer by discipline.', 'An independent builder based in India, working where technology and precision meet.', 'identity', '01', ['PROFILE', 'STORY', 'INDIA']),
  '/me': card('Digital profile', '@avrxt', 'Selected links, live status and the shortest route to everything avrxt.', 'identity', '02', ['AVIORXT', 'ONLINE', 'LINKS']),
  '/signature': card('Digital mark · 2026', 'The avrxt signature.', 'A motion-crafted personal signature, drawn one deliberate stroke at a time.', 'signature', '03', ['MOTION', 'IDENTITY', 'HAND-DRAWN']),
  '/contact': card('Open channel', 'Start a thoughtful conversation.', 'Questions, collaborations and meaningful ideas are always welcome.', 'contact', '04', ['CONTACT', 'COLLABORATE', 'CONNECT']),
  '/gallery': card('Visual archive', 'Frames from the journey.', 'A curated gallery of moments, details and visual experiments.', 'gallery', '05', ['ARCHIVE', 'FRAMES', 'STORIES']),
  '/uses': card('Working system', 'The tools behind the work.', 'Hardware, software and everyday instruments that make the process possible.', 'tools', '06', ['HARDWARE', 'SOFTWARE', 'WORKFLOW']),
  '/tools': card('Public utilities · 08', 'Small tools. Serious utility.', 'Fast, privacy-conscious browser tools designed with the same care as the rest of avrxt.dev.', 'tools', '07', ['NETWORK', 'TYPE', 'DIAGNOSTICS']),
  '/muzix/chart': card('Listening intelligence', 'Muzix chart.', 'Now playing, top artists, repeat signals and monthly listening patterns in one live capsule.', 'music', '08', ['SPOTIFY', 'NOW PLAYING', 'CHARTS']),
  '/subscribe': card('Low-frequency signal', 'Notes worth opening.', 'Occasional product notes, experiments and new releases — delivered without the noise.', 'contact', '09', ['NEWSLETTER', 'UPDATES', 'NO SPAM']),
  '/docs': card('Knowledge base', 'Documentation & field notes.', 'Technical guides, implementation notes and carefully documented experiments.', 'docs', '10', ['GUIDES', 'NOTES', 'REFERENCE']),
  '/system/api/doc': card('Developer interface', 'avrxt API reference.', 'Endpoints, response models and integration guidance for the public avrxt.dev API.', 'tools', '11', ['REST', 'JSON', 'REFERENCE']),
  '/annon/ownership': card('Ownership disclosure', 'Independent by design.', 'avrxt.dev is a personal website run and maintained by one independent individual.', 'legal', '12', ['PERSONAL', 'INDEPENDENT', 'TRANSPARENT']),
  '/legal/privacy': card('Legal · Privacy', 'Privacy, written plainly.', 'What avrxt.dev collects, why it is needed and the choices available to every visitor.', 'legal', '13', ['DATA', 'CHOICES', 'TRANSPARENCY']),
  '/legal/terms': card('Legal · Terms', 'Clear terms for a useful web.', 'The practical rules that keep avrxt.dev and its public tools fair, safe and available.', 'legal', '14', ['TERMS', 'ACCEPTABLE USE', 'SERVICES']),
  '/legal/security': card('Legal · Security', 'Security is part of the design.', 'Protective controls, responsible disclosure and the boundaries of public diagnostic tools.', 'security', '15', ['CSP', 'DISCLOSURE', 'SAFETY']),
  '/legal/refund': card('Legal · Refunds', 'A straightforward refund policy.', 'Clear expectations for digital services, eligibility, requests and processing.', 'legal', '16', ['ELIGIBILITY', 'REQUESTS', 'PROCESS']),
  '/legal/assets': card('Brand assets', 'The avrxt visual identity.', 'Official marks, monochrome variants and usage guidance for the avrxt.dev identity.', 'identity', '17', ['LOGOS', 'PALETTE', 'COPYRIGHT']),
  '/dc/privacy': card('Discord · Privacy', 'Discord privacy notice.', 'How avrxt Discord services handle identifiers, commands and operational data.', 'legal', '18', ['DISCORD', 'DATA', 'PRIVACY']),
  '/dc/terms': card('Discord · Terms', 'Discord service terms.', 'The rules and responsibilities that apply when using avrxt Discord services.', 'legal', '19', ['DISCORD', 'TERMS', 'SAFETY']),
};

function clampText(value: string, max: number) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length <= max ? normalized : `${normalized.slice(0, max - 1).trimEnd()}…`;
}

function normalizePath(input: string | null) {
  const raw = (input || '/').trim().split('?')[0].replace(/\/+$/, '') || '/';
  return !raw.startsWith('/') || raw.includes('://') || raw.includes('..') || raw.length > 200 ? '/' : raw;
}

function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createSupabaseClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

async function documentCard(path: string): Promise<OgCard> {
  const slug = path.split('/').filter(Boolean)[1] || 'docs';
  const fallback = card(`Documentation · ${slug.replace(/-/g, ' ')}`, slug.replace(/-/g, ' '), 'A technical field note from the avrxt.dev knowledge base.', 'docs', '10', ['DOCUMENT', 'REFERENCE', 'AVRXT.DEV']);
  const client = supabase();
  if (!client) return fallback;
  const { data } = await client.from('documents').select('title,description').eq('slug', slug).maybeSingle<{ title: string | null; description: string | null }>();
  return data ? { ...fallback, title: clampText(data.title || fallback.title, 58), description: clampText(data.description || fallback.description, 150) } : fallback;
}

async function cardForPath(path: string): Promise<OgCard> {
  if (ROUTES[path]) return ROUTES[path];
  if (path.startsWith('/tools/')) {
    const tool = getTool(path.split('/')[2] || '');
    if (tool) {
      const position = tools.findIndex((item) => item.slug === tool.slug) + 1;
      return card(tool.eyebrow, tool.title, tool.description, 'tools', `T${String(position).padStart(2, '0')}`, ['BROWSER TOOL', tool.shortTitle.toUpperCase(), 'FREE TO USE']);
    }
  }
  if (path.startsWith('/docs/')) return documentCard(path);
  return card('avrxt.dev', path.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'avrxt', 'An independent corner of the web, designed and maintained by avrxt.', 'identity', '—', ['AVRXT.DEV', 'INDEPENDENT', 'WEB']);
}

function seedFor(value: string) {
  return [...value].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 997, 17);
}

function artwork(data: OgCard, path: string) {
  const seed = seedFor(path);
  const line = 'rgba(255,255,255,.16)';

  if (data.motif === 'signature') return (
    <div style={{ position: 'relative', display: 'flex', width: 382, height: 292, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', left: 28, top: 116, width: 298, height: 2, background: '#f7f7f7', transform: 'rotate(-8deg)', boxShadow: '0 0 28px rgba(255,255,255,.2)' }} />
      <div style={{ position: 'absolute', left: 82, top: 72, width: 142, height: 118, border: '3px solid #f7f7f7', borderLeftColor: 'transparent', borderRadius: '58% 42% 52% 48%', transform: 'rotate(-12deg)' }} />
      <div style={{ position: 'absolute', left: 202, top: 102, width: 102, height: 72, borderTop: '3px solid #f7f7f7', borderRight: '3px solid #f7f7f7', borderRadius: 60, transform: 'rotate(16deg)' }} />
      <div style={{ position: 'absolute', bottom: 25, right: 18, fontSize: 11, letterSpacing: 4, color: '#858585' }}>STROKE / 06</div>
    </div>
  );

  if (data.motif === 'gallery') return (
    <div style={{ display: 'flex', width: 382, height: 292, gap: 12, alignItems: 'center', justifyContent: 'center' }}>
      {[0, 1, 2].map((item) => <div key={item} style={{ display: 'flex', width: item === 1 ? 126 : 96, height: item === 1 ? 202 : 164, padding: 9, border: `1px solid ${line}`, background: '#080808', transform: `rotate(${item === 0 ? -7 : item === 2 ? 7 : 0}deg)` }}><div style={{ display: 'flex', width: '100%', height: '100%', background: `linear-gradient(${125 + item * 30}deg,#121212,#333 52%,#080808)`, alignItems: 'flex-end', padding: 10 }}><div style={{ width: 28 + item * 9, height: 2, background: '#bcbcbc' }} /></div></div>)}
    </div>
  );

  if (data.motif === 'music') return (
    <div style={{ display: 'flex', width: 382, height: 292, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      {[42, 88, 126, 72, 158, 108, 56, 132, 82, 46].map((height, index) => <div key={index} style={{ width: 12, height, borderRadius: 10, background: index === 4 ? '#fff' : index % 2 ? '#686868' : '#292929' }} />)}
    </div>
  );

  if (data.motif === 'tools') {
    const tool = path.split('/')[2] || 'all';
    const marks: Record<string, string> = { keytest: 'KEY', whatismyip: 'IP', portcheck: ':80', mailfy: 'MAIL', dns: 'DNS', fontui: 'Aa', spotmp3: 'MP3', quote: '“ ”', all: '08' };
    return <div style={{ display: 'flex', width: 382, height: 292, alignItems: 'center', justifyContent: 'center', position: 'relative', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', width: 218, height: 218, border: '2px solid #686868', borderRadius: 218, transform: `rotate(${seed % 12 - 6}deg)` }} />
      <div style={{ position: 'absolute', width: 184, height: 204, border: '1px dashed #484848', borderRadius: '49% 44% 52% 46%', transform: 'rotate(9deg)' }} />
      <div style={{ display: 'flex', fontSize: tool === 'quote' ? 54 : 62, fontWeight: 700, letterSpacing: -5, color: '#f7f7f7', transform: 'rotate(-3deg)' }}>{marks[tool] || marks.all}</div>
      <div style={{ display: 'flex', width: 112, height: 2, background: '#bcbcbc', transform: 'rotate(4deg)', marginTop: 12 }} />
      <div style={{ position: 'absolute', top: 28, right: 38, fontSize: 18, color: '#858585', transform: 'rotate(8deg)' }}>+</div>
      <div style={{ position: 'absolute', display: 'flex', bottom: 24, left: 48, fontSize: 10, color: '#858585', letterSpacing: 3 }}>{String(seed).padStart(3, '0')} / LAB</div>
    </div>;
  }

  if (data.motif === 'security') return (
    <div style={{ display: 'flex', width: 382, height: 292, alignItems: 'center', justifyContent: 'center' }}><div style={{ display: 'flex', width: 154, height: 190, border: '2px solid #d0d0d0', borderRadius: '76px 76px 58px 58px', clipPath: 'polygon(50% 0,100% 18%,92% 75%,50% 100%,8% 75%,0 18%)', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(145deg,#1f1f1f,#080808)' }}><div style={{ width: 20, height: 20, border: '3px solid #fff', borderRadius: 20, boxShadow: '0 0 0 16px rgba(255,255,255,.04)' }} /></div></div>
  );

  if (data.motif === 'contact') return (
    <div style={{ display: 'flex', width: 382, height: 292, alignItems: 'center', justifyContent: 'center' }}><div style={{ display: 'flex', width: 312, height: 170, border: `1px solid ${line}`, background: '#0a0a0a', padding: 22, flexDirection: 'column', justifyContent: 'space-between', boxShadow: '18px 18px 0 #121212' }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><div style={{ width: 42, height: 4, background: '#fff' }} /><div style={{ width: 9, height: 9, borderRadius: 9, background: '#686868' }} /></div><div style={{ width: '100%', height: 1, background: line }} /><div style={{ display: 'flex', gap: 8 }}><div style={{ width: 98, height: 8, background: '#333' }} /><div style={{ width: 54, height: 8, background: '#1f1f1f' }} /></div></div></div>
  );

  if (data.motif === 'docs' || data.motif === 'legal') return (
    <div style={{ display: 'flex', width: 382, height: 292, alignItems: 'center', justifyContent: 'center' }}><div style={{ display: 'flex', width: 238, height: 242, background: '#0a0a0a', border: `1px solid ${line}`, padding: 28, flexDirection: 'column', gap: 22, transform: `rotate(${seed % 2 ? 2 : -2}deg)`, boxShadow: '18px 18px 0 #121212' }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><div style={{ fontSize: 13, color: '#d0d0d0' }}>{data.index}</div><div style={{ width: 16, height: 16, border: '1px solid #686868' }} /></div>{[100, 72, 88, 54].map((width, index) => <div key={index} style={{ width: `${width}%`, height: index === 0 ? 3 : 2, background: index === 0 ? '#fff' : '#484848' }} />)}</div></div>
  );

  return (
    <div style={{ position: 'relative', display: 'flex', width: 382, height: 292, alignItems: 'center', justifyContent: 'center' }}><div style={{ position: 'absolute', width: 212, height: 212, borderRadius: 212, border: `1px solid ${line}` }} /><div style={{ position: 'absolute', width: 144, height: 144, borderRadius: 144, border: `1px solid ${line}` }} /><div style={{ position: 'absolute', width: 72, height: 72, transform: 'rotate(45deg)', background: 'rgba(255,255,255,.06)', border: '1px solid #686868' }} /><div style={{ fontSize: 42, fontWeight: 700, letterSpacing: -3 }}>AV</div><div style={{ position: 'absolute', width: 278, height: 1, background: '#484848', transform: `rotate(${(seed % 35) - 17}deg)` }} /></div>
  );
}

function premiumArtwork(data: OgCard, path: string) {
  const code = path.startsWith('/tools/') ? (path.split('/')[2] || 'tool').slice(0, 4).toUpperCase() : data.index;
  return (
    <div style={{ position: 'relative', display: 'flex', width: 390, height: 318, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', top: 8, left: 14, fontSize: 72, lineHeight: 1, color: '#1f1f1f', fontWeight: 700, letterSpacing: -8 }}>{data.index}</div>
      <div style={{ position: 'absolute', top: 20, right: 26, display: 'flex', width: 52, height: 20, background: '#bcbcbc', opacity: .35, transform: 'rotate(8deg)' }} />
      <div style={{ position: 'absolute', bottom: 25, left: 16, display: 'flex', width: 68, height: 22, background: '#858585', opacity: .28, transform: 'rotate(-10deg)' }} />
      <div style={{ position: 'absolute', top: 56, right: 14, fontSize: 28, color: '#d0d0d0', transform: 'rotate(12deg)' }}>+</div>
      <div style={{ position: 'absolute', bottom: 48, right: 24, fontSize: 20, color: '#858585' }}>+</div>
      <div style={{ position: 'absolute', top: 34, left: 108, display: 'flex', padding: '7px 11px', border: '1px solid #484848', borderRadius: 20, color: '#bcbcbc', background: '#080808', fontSize: 10, letterSpacing: 2, transform: 'rotate(-4deg)' }}>ORIGINAL / {code}</div>
      <div style={{ position: 'absolute', width: 330, height: 238, border: '1px dashed #484848', transform: 'rotate(3deg)', borderRadius: 4 }} />
      <div style={{ display: 'flex', width: 332, height: 242, alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(145deg,#101010,#050505)', border: '1px solid #686868', transform: 'rotate(-2deg)', boxShadow: '14px 16px 0 #121212', overflow: 'hidden' }}>
        <div style={{ display: 'flex', transform: 'scale(.78)' }}>{artwork(data, path)}</div>
      </div>
      <svg width="98" height="54" viewBox="0 0 98 54" style={{ position: 'absolute', right: 4, bottom: 4, transform: 'rotate(-8deg)' }}>
        <path d="M4 42 C30 10 58 8 86 29" fill="none" stroke="#a3a3a3" strokeWidth="2" strokeLinecap="round" />
        <path d="M77 19 L88 29 L74 34" fill="none" stroke="#a3a3a3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function topBar(path: string, index: string) {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 22, borderBottom: '1px solid #1f1f1f' }}><div style={{ display: 'flex', alignItems: 'center', gap: 14 }}><div style={{ width: 24, height: 24, border: '1px solid #686868', transform: 'rotate(45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 6, height: 6, background: '#f7f7f7' }} /></div><div style={{ fontSize: 18, letterSpacing: 3, color: '#f7f7f7' }}>AVRXT.DEV</div></div><div style={{ display: 'flex', alignItems: 'center', gap: 18, color: '#858585', fontSize: 12, letterSpacing: 2 }}><div>{clampText(path.toUpperCase(), 32)}</div><div style={{ color: '#f7f7f7' }}>{index}</div></div></div>;
}

export async function renderDynamicOgImage(requestUrl: string) {
  const { searchParams } = new URL(requestUrl);
  const path = normalizePath(searchParams.get('path'));
  const data = await cardForPath(path);
  const fonts = await getOgFonts();

  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '38px 46px 34px', background: '#000', color: '#fff', fontFamily: 'Space Mono', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: .18, backgroundImage: 'linear-gradient(to right, #1f1f1f 1px, transparent 1px), linear-gradient(to bottom, #1f1f1f 1px, transparent 1px)', backgroundSize: '72px 72px' }} />
      <div style={{ position: 'absolute', width: 520, height: 520, right: -110, top: -190, borderRadius: 520, background: 'radial-gradient(circle,rgba(255,255,255,.09),transparent 68%)' }} />
      <div style={{ position: 'absolute', left: -34, bottom: 72, width: 124, height: 124, border: '1px dashed #292929', borderRadius: 124 }} />
      <div style={{ position: 'absolute', left: 30, bottom: 122, fontSize: 22, color: '#484848', transform: 'rotate(-15deg)' }}>+</div>
      <svg width="310" height="105" viewBox="0 0 310 105" style={{ position: 'absolute', left: 340, bottom: -8, opacity: .28 }}>
        <path d="M3 70 C45 17 79 102 121 52 S197 16 226 54 S275 91 307 39" fill="none" stroke="#686868" strokeWidth="2" strokeLinecap="round" strokeDasharray="5 9" />
      </svg>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}>
        {topBar(path, data.index)}
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 46 }}>
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 20, position: 'relative' }}>
            <div style={{ display: 'flex', alignSelf: 'flex-start', padding: '8px 13px', border: '1px solid #484848', background: '#0b0b0b', fontSize: 11, letterSpacing: 3, color: '#bcbcbc', textTransform: 'uppercase', transform: 'rotate(-1.5deg)', boxShadow: '5px 5px 0 #121212' }}>{data.eyebrow}</div>
            <div style={{ position: 'relative', display: 'flex', maxWidth: 690 }}>
              <div style={{ fontSize: data.title.length > 42 ? 46 : 57, lineHeight: 1.08, letterSpacing: -3, fontWeight: 700, color: '#f7f7f7' }}>{clampText(data.title, 72)}</div>
              <div style={{ position: 'absolute', right: -10, top: -19, fontSize: 27, color: '#858585', transform: 'rotate(10deg)' }}>+</div>
            </div>
            <svg width="190" height="16" viewBox="0 0 190 16" style={{ marginTop: -12 }}><path d="M3 9 C42 3 68 13 104 7 S157 4 187 9" fill="none" stroke="#d0d0d0" strokeWidth="2" strokeLinecap="round" /><path d="M10 13 C53 10 93 15 155 11" fill="none" stroke="#484848" strokeWidth="1" strokeLinecap="round" /></svg>
            <div style={{ fontSize: 17, lineHeight: 1.5, color: '#a3a3a3', maxWidth: 650 }}>{clampText(data.description, 165)}</div>
            <div style={{ display: 'flex', gap: 9, paddingTop: 6 }}>{data.chips.map((chip, index) => <div key={chip} style={{ display: 'flex', padding: '8px 11px', border: `1px ${index === 1 ? 'dashed' : 'solid'} #484848`, background: index === 1 ? '#f7f7f7' : '#080808', color: index === 1 ? '#080808' : '#a3a3a3', fontSize: 10, letterSpacing: 1.5, transform: `rotate(${index === 0 ? -2 : index === 2 ? 2 : 0}deg)` }}>{chip}</div>)}</div>
            <div style={{ position: 'absolute', right: 22, bottom: -8, display: 'flex', alignItems: 'center', gap: 8, color: '#666', fontSize: 9, letterSpacing: 2, transform: 'rotate(-6deg)' }}><div style={{ width: 24, height: 1, background: '#666' }} /> MADE TO EXPLORE</div>
          </div>
          <div style={{ display: 'flex', width: 410, height: 342, border: '1px solid #292929', background: 'linear-gradient(145deg,#0b0b0b,#030303)', alignItems: 'center', justifyContent: 'center', position: 'relative', transform: 'rotate(1deg)', boxShadow: '-12px 16px 0 rgba(255,255,255,.025)' }}><div style={{ position: 'absolute', top: 12, left: 12, width: 10, height: 10, borderTop: '1px solid #858585', borderLeft: '1px solid #858585' }} /><div style={{ position: 'absolute', right: 12, bottom: 12, width: 10, height: 10, borderRight: '1px solid #858585', borderBottom: '1px solid #858585' }} />{premiumArtwork(data, path)}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 18, borderTop: '1px solid #1f1f1f', fontSize: 10, letterSpacing: 2.5, color: '#666' }}><div>INDEPENDENTLY DESIGNED &amp; BUILT</div><div>WWW.AVRXT.DEV</div></div>
      </div>
    </div>,
    { width: OG_WIDTH, height: OG_HEIGHT, fonts, headers: { 'content-type': 'image/png', 'cache-control': 'public, s-maxage=86400, stale-while-revalidate=604800' } }
  );
}
