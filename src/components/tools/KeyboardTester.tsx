'use client';

import { useMemo, useRef, useState } from 'react';
import { Activity, CircleDot, Keyboard, RotateCcw, Sparkles, Zap } from 'lucide-react';

type KeyDefinition = { code: string; label: string; sub?: string; units?: number; gap?: boolean };
type LightingMode = 'wave' | 'aurora' | 'breathing' | 'reactive' | 'heatmap' | 'solid' | 'off';
type ResponseMode = 'instant' | 'pulse' | 'ripple' | 'trail';

const lightingModes: Array<{ value: LightingMode; label: string }> = [
  { value: 'wave', label: 'Spectrum wave' }, { value: 'aurora', label: 'Aurora' }, { value: 'breathing', label: 'Breathing' }, { value: 'reactive', label: 'Reactive' }, { value: 'heatmap', label: 'Heatmap' }, { value: 'solid', label: 'Solid' }, { value: 'off', label: 'Off' },
];
const responseModes: Array<{ value: ResponseMode; label: string }> = [
  { value: 'instant', label: 'Instant' }, { value: 'pulse', label: 'Pulse' }, { value: 'ripple', label: 'Ripple' }, { value: 'trail', label: 'Trail' },
];
const colorPresets = ['#ffffff', '#00e5ff', '#7c5cff', '#ff3d9a', '#ff6b35', '#53ff8a'];

const rows: KeyDefinition[][] = [
  [
    { code: 'Escape', label: 'Esc', units: 1.2 }, { code: 'F1', label: 'F1', gap: true }, { code: 'F2', label: 'F2' }, { code: 'F3', label: 'F3' }, { code: 'F4', label: 'F4' },
    { code: 'F5', label: 'F5', gap: true }, { code: 'F6', label: 'F6' }, { code: 'F7', label: 'F7' }, { code: 'F8', label: 'F8' }, { code: 'F9', label: 'F9', gap: true }, { code: 'F10', label: 'F10' }, { code: 'F11', label: 'F11' }, { code: 'F12', label: 'F12' },
  ],
  [
    { code: 'Backquote', label: '`', sub: '~' }, { code: 'Digit1', label: '1', sub: '!' }, { code: 'Digit2', label: '2', sub: '@' }, { code: 'Digit3', label: '3', sub: '#' }, { code: 'Digit4', label: '4', sub: '$' }, { code: 'Digit5', label: '5', sub: '%' }, { code: 'Digit6', label: '6', sub: '^' }, { code: 'Digit7', label: '7', sub: '&' }, { code: 'Digit8', label: '8', sub: '*' }, { code: 'Digit9', label: '9', sub: '(' }, { code: 'Digit0', label: '0', sub: ')' }, { code: 'Minus', label: '-', sub: '_' }, { code: 'Equal', label: '=', sub: '+' }, { code: 'Backspace', label: 'Backspace', units: 2 },
  ],
  [
    { code: 'Tab', label: 'Tab', units: 1.55 }, { code: 'KeyQ', label: 'Q' }, { code: 'KeyW', label: 'W' }, { code: 'KeyE', label: 'E' }, { code: 'KeyR', label: 'R' }, { code: 'KeyT', label: 'T' }, { code: 'KeyY', label: 'Y' }, { code: 'KeyU', label: 'U' }, { code: 'KeyI', label: 'I' }, { code: 'KeyO', label: 'O' }, { code: 'KeyP', label: 'P' }, { code: 'BracketLeft', label: '[', sub: '{' }, { code: 'BracketRight', label: ']', sub: '}' }, { code: 'Backslash', label: '\\', sub: '|', units: 1.45 },
  ],
  [
    { code: 'CapsLock', label: 'Caps Lock', units: 1.85 }, { code: 'KeyA', label: 'A' }, { code: 'KeyS', label: 'S' }, { code: 'KeyD', label: 'D' }, { code: 'KeyF', label: 'F' }, { code: 'KeyG', label: 'G' }, { code: 'KeyH', label: 'H' }, { code: 'KeyJ', label: 'J' }, { code: 'KeyK', label: 'K' }, { code: 'KeyL', label: 'L' }, { code: 'Semicolon', label: ';', sub: ':' }, { code: 'Quote', label: "'", sub: '"' }, { code: 'Enter', label: 'Enter', units: 2.2 },
  ],
  [
    { code: 'ShiftLeft', label: 'Shift', units: 2.3 }, { code: 'KeyZ', label: 'Z' }, { code: 'KeyX', label: 'X' }, { code: 'KeyC', label: 'C' }, { code: 'KeyV', label: 'V' }, { code: 'KeyB', label: 'B' }, { code: 'KeyN', label: 'N' }, { code: 'KeyM', label: 'M' }, { code: 'Comma', label: ',', sub: '<' }, { code: 'Period', label: '.', sub: '>' }, { code: 'Slash', label: '/', sub: '?' }, { code: 'ShiftRight', label: 'Shift', units: 2.75 },
  ],
  [
    { code: 'ControlLeft', label: 'Ctrl', units: 1.3 }, { code: 'MetaLeft', label: 'Win', units: 1.3 }, { code: 'AltLeft', label: 'Alt', units: 1.3 }, { code: 'Space', label: '', units: 6.35 }, { code: 'AltRight', label: 'Alt', units: 1.3 }, { code: 'ControlRight', label: 'Ctrl', units: 1.3 }, { code: 'ArrowLeft', label: '←', gap: true }, { code: 'ArrowUp', label: '↑' }, { code: 'ArrowDown', label: '↓' }, { code: 'ArrowRight', label: '→' },
  ],
];

const modifierCodes = ['ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight'];

function Keycap({ definition, pressed, tested, recent, index, activeIndex, lighting, response, speed, brightness, color, heat, burst }: { definition: KeyDefinition; pressed: boolean; tested: boolean; recent: boolean; index: number; activeIndex: number; lighting: LightingMode; response: ResponseMode; speed: number; brightness: number; color: string; heat: number; burst: number }) {
  const width = 43 * (definition.units || 1) + Math.max(0, (definition.units || 1) - 1) * 5;
  const effectColor = lighting === 'heatmap' ? `hsl(${Math.max(0, 250 - heat * 250)} 100% 58%)` : lighting === 'wave' ? `hsl(${(index * 19) % 360} 100% 58%)` : lighting === 'aurora' ? `hsl(${155 + (index % 8) * 10} 100% 55%)` : color;
  const reactiveOnly = lighting === 'reactive';
  const illuminated = lighting !== 'off' && (!reactiveOnly || pressed || recent) && (lighting !== 'heatmap' || tested);
  const effectClass = lighting === 'wave' ? 'keytest-rgb-wave' : lighting === 'aurora' ? 'keytest-rgb-aurora' : lighting === 'breathing' ? 'keytest-rgb-breathe' : '';
  const responseClass = response === 'pulse' && recent ? 'keytest-response-pulse' : response === 'ripple' && activeIndex >= 0 ? 'keytest-response-ripple' : response === 'trail' && recent ? 'keytest-response-trail' : '';
  const style = {
    '--key-rgb': effectColor,
    '--key-brightness': `${brightness / 100}`,
    '--key-speed': `${Math.max(1.2, 7 - speed)}s`,
    '--key-delay': `${lighting === 'wave' ? -index * 0.055 : response === 'ripple' ? Math.abs(index - activeIndex) * 0.035 : 0}s`,
    background: illuminated ? `linear-gradient(180deg, color-mix(in srgb, ${effectColor} ${Math.round(brightness * .68)}%, #202020), #0b0b0b)` : undefined,
    borderColor: illuminated ? `color-mix(in srgb, ${effectColor} ${Math.round(brightness * .8)}%, #333)` : undefined,
    boxShadow: illuminated ? `0 5px 0 #050505, 0 8px 18px color-mix(in srgb, ${effectColor} ${Math.round(brightness * .42)}%, transparent), inset 0 1px 0 rgba(255,255,255,.22)` : undefined,
  } as React.CSSProperties & Record<string, string>;
  return <div className={`${definition.gap ? 'ml-3' : ''} shrink-0 [perspective:180px]`} style={{ width }}><div key={`${definition.code}-${response === 'ripple' ? burst : 0}`} style={style} className={`relative flex h-11 select-none items-center justify-center overflow-hidden rounded-[5px] border px-1 text-center font-mono transition-all ${effectClass} ${responseClass} ${pressed ? 'translate-y-[5px] border-white !bg-white text-black !shadow-[0_1px_0_#686868]' : tested ? 'border-[#686868] bg-[#1A1A1A] text-white shadow-[0_5px_0_#050505,0_7px_12px_rgba(0,0,0,.75),inset_0_1px_0_rgba(255,255,255,.12)]' : 'border-[#333] bg-gradient-to-b from-[#202020] to-[#101010] text-[#E5E5E5] shadow-[0_5px_0_#050505,0_7px_12px_rgba(0,0,0,.75),inset_0_1px_0_rgba(255,255,255,.09)]'}`}><span className={`${definition.label.length > 3 ? 'text-[8px]' : 'text-[11px]'} relative z-10 tracking-wide [text-shadow:0_1px_2px_#000]`}>{definition.sub && <span className="mr-1 text-[8px] opacity-60">{definition.sub}</span>}{definition.label}</span>{tested && !pressed && <span className="absolute right-1.5 top-1.5 size-1 rounded-full bg-white/70" />}</div></div>;
}

export default function KeyboardTester() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [pressed, setPressed] = useState<Set<string>>(new Set());
  const [tested, setTested] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<Array<{ key: string; code: string }>>([]);
  const [strokes, setStrokes] = useState(0);
  const [lighting, setLighting] = useState<LightingMode>('wave');
  const [response, setResponse] = useState<ResponseMode>('ripple');
  const [speed, setSpeed] = useState(4);
  const [brightness, setBrightness] = useState(75);
  const [color, setColor] = useState('#7c5cff');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [activeIndex, setActiveIndex] = useState(-1);
  const [burst, setBurst] = useState(0);
  const allKeys = useMemo(() => rows.flat(), []);

  const begin = () => { setActive(true); window.requestAnimationFrame(() => stageRef.current?.focus()); };
  const reset = () => { setPressed(new Set()); setTested(new Set()); setHistory([]); setStrokes(0); setCounts({}); setActiveIndex(-1); window.requestAnimationFrame(() => stageRef.current?.focus()); };
  const keyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.repeat) return;
    const code = event.code || event.key;
    setPressed((current) => new Set(current).add(code));
    setTested((current) => new Set(current).add(code));
    setHistory((current) => [{ key: event.key === ' ' ? 'Space' : event.key, code }, ...current].slice(0, 8));
    setStrokes((current) => current + 1);
    setCounts((current) => ({ ...current, [code]: (current[code] || 0) + 1 }));
    setActiveIndex(allKeys.findIndex((key) => key.code === code));
    setBurst((current) => current + 1);
  };
  const keyUp = (event: React.KeyboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const code = event.code || event.key;
    setPressed((current) => { const next = new Set(current); next.delete(code); return next; });
  };
  const modifiers = modifierCodes.filter((code) => pressed.has(code));
  const progress = Math.round((tested.size / allKeys.length) * 100);
  const recentCodes = new Set(history.slice(0, response === 'trail' ? 8 : 2).map((entry) => entry.code));
  const maxCount = Math.max(1, ...Object.values(counts));

  return <div>
    <div className="mb-5 grid gap-px border border-[#292929] bg-[#292929] sm:grid-cols-3"><div className="bg-black p-4"><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#666666]">Keys tested</p><p className="mt-2 text-2xl font-semibold">{tested.size}<span className="ml-1 text-sm text-[#666666]">/ {allKeys.length}</span></p></div><div className="bg-black p-4"><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#666666]">Keystrokes</p><p className="mt-2 text-2xl font-semibold">{strokes}</p></div><div className="bg-black p-4"><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#666666]">Coverage</p><p className="mt-2 text-2xl font-semibold">{progress}%</p></div></div>

    <section className="mb-5 border border-[#292929] bg-black p-4 sm:p-5"><div className="mb-5 flex flex-col gap-3 border-b border-[#1F1F1F] pb-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center border border-[#333] bg-[#0d0d0d]"><Sparkles size={16} /></span><div><p className="text-sm font-medium">RGB lighting studio</p><p className="mt-1 text-xs text-[#666666]">Tune the lighting and physical key response in real time.</p></div></div><span className="flex w-fit items-center gap-2 border border-[#292929] px-3 py-2 font-mono text-[8px] uppercase tracking-[.16em] text-[#858585]"><span className="size-1.5 animate-pulse rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }} /> Live preview</span></div><div className="grid gap-5 lg:grid-cols-2"><div><p className="mb-2 font-mono text-[9px] uppercase tracking-[.18em] text-[#666666]">Lighting effect</p><div className="grid grid-cols-2 gap-1 sm:grid-cols-4">{lightingModes.map((mode) => <button key={mode.value} type="button" onClick={() => setLighting(mode.value)} className={`min-h-10 border px-2 font-mono text-[8px] uppercase tracking-[.12em] transition-all ${lighting === mode.value ? 'border-white bg-white text-black' : 'border-[#292929] bg-[#080808] text-[#858585] hover:border-[#686868] hover:text-white'}`}>{mode.label}</button>)}</div></div><div><p className="mb-2 font-mono text-[9px] uppercase tracking-[.18em] text-[#666666]">Key response</p><div className="grid grid-cols-2 gap-1 sm:grid-cols-4">{responseModes.map((mode) => <button key={mode.value} type="button" onClick={() => setResponse(mode.value)} className={`min-h-10 border px-2 font-mono text-[8px] uppercase tracking-[.12em] transition-all ${response === mode.value ? 'border-white bg-white text-black' : 'border-[#292929] bg-[#080808] text-[#858585] hover:border-[#686868] hover:text-white'}`}>{mode.label}</button>)}</div></div></div><div className="mt-5 grid gap-5 border-t border-[#1F1F1F] pt-5 md:grid-cols-3"><div><p className="mb-2 font-mono text-[9px] uppercase tracking-[.18em] text-[#666666]">Animation speed</p><div className="grid grid-cols-3 gap-1">{[{ label: 'Slow', value: 2 }, { label: 'Normal', value: 4 }, { label: 'Fast', value: 6 }].map((option) => <button key={option.value} type="button" onClick={() => setSpeed(option.value)} className={`min-h-9 border font-mono text-[8px] uppercase tracking-[.12em] ${speed === option.value ? 'border-[#BCBCBC] bg-[#1F1F1F] text-white' : 'border-[#292929] text-[#666666]'}`}>{option.label}</button>)}</div></div><div><p className="mb-2 font-mono text-[9px] uppercase tracking-[.18em] text-[#666666]">Brightness</p><div className="grid grid-cols-4 gap-1">{[25, 50, 75, 100].map((value) => <button key={value} type="button" onClick={() => setBrightness(value)} className={`min-h-9 border font-mono text-[8px] ${brightness === value ? 'border-[#BCBCBC] bg-[#1F1F1F] text-white' : 'border-[#292929] text-[#666666]'}`}>{value}%</button>)}</div></div><div><p className="mb-2 font-mono text-[9px] uppercase tracking-[.18em] text-[#666666]">Accent color</p><div className="flex min-h-9 items-center gap-2">{colorPresets.map((preset) => <button key={preset} type="button" aria-label={`Use ${preset} lighting`} onClick={() => setColor(preset)} className={`size-7 rounded-full border-2 transition-transform hover:scale-110 ${color === preset ? 'border-white scale-110' : 'border-[#292929]'}`} style={{ backgroundColor: preset, boxShadow: color === preset ? `0 0 14px ${preset}` : undefined }} />)}</div></div></div></section>

    <div ref={stageRef} tabIndex={0} role="application" aria-label="Interactive keyboard tester" onKeyDown={keyDown} onKeyUp={keyUp} onBlur={() => setPressed(new Set())} className={`relative overflow-hidden border bg-black outline-none transition-colors focus-visible:outline-none ${active ? 'border-[#686868]' : 'border-[#292929]'}`}>
      <div className="flex flex-col gap-3 border-b border-[#1F1F1F] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className={`grid size-9 place-items-center rounded-full border ${active ? 'border-white bg-white text-black' : 'border-[#333] bg-[#121212] text-[#686868]'}`}><Activity size={15} /></span><div><p className="text-sm font-medium">{active ? 'Keyboard listening' : 'Ready for input'}</p><p className="mt-1 text-xs text-[#666666]">{active ? 'Press every key. Active keys move in real time.' : 'Start the test, then use your physical keyboard.'}</p></div></div><div className="flex gap-2"><button type="button" onClick={begin} className="min-h-10 bg-white px-4 font-mono text-[9px] font-bold uppercase tracking-[.16em] text-black">{active ? 'Refocus test' : 'Start test'}</button><button type="button" onClick={reset} aria-label="Reset keyboard test" className="grid size-10 place-items-center border border-[#333] bg-[#080808] text-[#A3A3A3] transition-colors hover:border-[#686868] hover:text-white"><RotateCcw size={14} /></button></div></div>

      <div className="overflow-x-auto p-4 pb-7 sm:p-7"><div className="mx-auto w-[850px] rounded-2xl border border-[#333] bg-gradient-to-b from-[#252525] via-[#131313] to-[#080808] p-4 pb-6 shadow-[0_22px_45px_rgba(0,0,0,.8),inset_0_1px_0_rgba(255,255,255,.13),0_2px_0_#333] sm:p-5"><div className="mb-4 flex items-center justify-between px-1"><div className="flex items-center gap-2"><Keyboard size={14} className="text-[#858585]" /><span className="font-mono text-[8px] uppercase tracking-[.24em] text-[#666666]">AVRXT / KEYTEST</span></div><div className="flex items-center gap-3 font-mono text-[7px] uppercase tracking-[.14em] text-[#484848]"><span className="flex items-center gap-1"><CircleDot size={8} className={tested.has('CapsLock') ? 'text-white' : ''} /> Caps</span><span className="flex items-center gap-1"><Zap size={8} style={{ color: lighting === 'off' ? undefined : color }} /> {lighting}</span><span className="flex items-center gap-1"><CircleDot size={8} className={active ? 'text-white' : ''} /> Live</span></div></div><div className="grid gap-2.5">{rows.map((row, rowIndex) => <div key={rowIndex} className="flex items-center gap-1.5">{row.map((key) => { const index = allKeys.findIndex((item) => item.code === key.code); return <Keycap key={key.code} definition={key} index={index} activeIndex={activeIndex} pressed={pressed.has(key.code)} tested={tested.has(key.code)} recent={recentCodes.has(key.code)} lighting={lighting} response={response} speed={speed} brightness={brightness} color={color} heat={(counts[key.code] || 0) / maxCount} burst={burst} />; })}</div>)}</div></div></div>
      {!active && <div className="absolute inset-x-0 bottom-0 top-[73px] grid place-items-center bg-black/55 backdrop-blur-[2px]"><button type="button" onClick={begin} className="group grid place-items-center text-center"><span className="grid size-16 place-items-center rounded-full border border-[#484848] bg-black text-white shadow-2xl transition-all group-hover:scale-105 group-hover:border-white"><Keyboard size={24} /></span><span className="mt-4 font-mono text-[9px] uppercase tracking-[.24em] text-[#BCBCBC]">Click to begin</span></button></div>}
    </div>

    <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_2fr]"><div className="border border-[#1F1F1F] bg-black p-4"><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#666666]">Active modifiers</p><div className="mt-4 flex min-h-8 flex-wrap gap-2">{modifiers.length ? modifiers.map((code) => <span key={code} className="border border-white bg-white px-2.5 py-1 font-mono text-[8px] uppercase tracking-[.12em] text-black">{code.replace(/Left|Right/, '')}</span>) : <span className="text-xs text-[#484848]">None pressed</span>}</div></div><div className="border border-[#1F1F1F] bg-black p-4"><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#666666]">Recent input</p><div className="mt-4 flex min-h-8 flex-wrap gap-2">{history.length ? history.map((entry, index) => <span key={`${entry.code}-${index}`} className={`${index === 0 ? 'border-[#858585] text-white' : 'border-[#292929] text-[#686868]'} border px-2.5 py-1 font-mono text-[8px] uppercase tracking-[.1em]`}>{entry.key} <span className="ml-1 opacity-50">{entry.code}</span></span>) : <span className="text-xs text-[#484848]">Your key history will appear here.</span>}</div></div></div>
    <p className="mt-4 text-xs leading-5 text-[#666666]">Some operating-system and browser-reserved shortcuts may be intercepted before a webpage can detect them. No keystrokes leave this page.</p>
  </div>;
}
