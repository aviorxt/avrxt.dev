'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { usePathname } from 'next/navigation';

export default function SiteFloralAtmosphere() {
    const pathname = usePathname();
    const hidden = /\/(dashboard|admin|auth)(\/|$)/.test(pathname);
    const layer = useRef<HTMLDivElement>(null);
    const [paused, setPaused] = useState(false);
    useEffect(() => {
        const receive = (event: Event) => setPaused(Boolean((event as CustomEvent<boolean>).detail));
        window.addEventListener('avrxt-motion', receive);
        return () => window.removeEventListener('avrxt-motion', receive);
    }, []);
    useEffect(() => {
        document.documentElement.dataset.floralPaused = String(paused);
        return () => { delete document.documentElement.dataset.floralPaused; };
    }, [paused]);
    useEffect(() => {
        if (hidden || paused) return;
        const query = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
        let frame = 0;
        const move = (event: PointerEvent) => {
            if (!query.matches || event.pointerType !== 'mouse' || frame) return;
            frame = requestAnimationFrame(() => {
                frame = 0;
                layer.current?.style.setProperty('--floral-x', `${(event.clientX / innerWidth - .5) * 24}px`);
                layer.current?.style.setProperty('--floral-y', `${(event.clientY / innerHeight - .5) * 18}px`);
            });
        };
        const visibility = () => {
            if (layer.current) layer.current.dataset.sleeping = String(document.hidden);
        };
        window.addEventListener('pointermove', move, { passive: true });
        document.addEventListener('visibilitychange', visibility);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('pointermove', move);
            document.removeEventListener('visibilitychange', visibility);
        };
    }, [hidden, paused]);
    if (hidden) return null;
    return <>
        <div ref={layer} className="site-floral-atmosphere" aria-hidden="true">
            <div className="site-floral-haze"/><div className="site-floral-haze is-cool"/>
            {[0,1,2,3,4,5].map(index => <span className="site-floral-petal" key={index} style={{'--petal-index':index,'--petal-color':['#d8a4cf','#8bc9c0','#e2b594'][index%3]} as CSSProperties}><svg viewBox="0 0 35 65"><path d="M17 63C-8 28 1 2 18 1C38 4 41 34 17 63Z" fill="currentColor"/><path d="M17 60Q27 26 18 5" stroke="#fff" strokeOpacity=".35" fill="none"/></svg></span>)}
        </div>
        <button className="site-floral-toggle" type="button" aria-pressed={paused} aria-label={paused?'Resume decorative motion':'Pause decorative motion'} onClick={() => window.dispatchEvent(new CustomEvent('avrxt-motion',{detail:!paused}))}><span aria-hidden="true">✳</span> {paused?'Motion off':'Motion on'}</button>
    </>;
}
