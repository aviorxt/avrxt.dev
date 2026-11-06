import type { CSSProperties } from 'react';

export default function GardenWordmark({ large = false }: { large?: boolean }) {
    const gradient = large ? 'footer-brand-petal' : 'header-brand-petal';
    return <b className={`avrxt-motion-mark${large ? ' is-large' : ''}`} aria-hidden="true">
        <b className="avrxt-mark-letters">{'avrxt'.split('').map((letter, index) => <i key={index} style={{ '--letter-index': index } as CSSProperties}>{letter}</i>)}</b>
        <svg className="avrxt-mark-flower" viewBox="-24 -24 48 48" fill="none">
            <defs><linearGradient id={gradient} x1="-8" y1="-22" x2="8" y2="5" gradientUnits="userSpaceOnUse"><stop stopColor="#f7d9ec"/><stop offset=".5" stopColor="#cc9bbf"/><stop offset="1" stopColor="#78627e"/></linearGradient></defs>
            {Array.from({length:8}, (_, index) => <ellipse key={index} cy="-12" rx="5" ry="10" transform={`rotate(${index * 45})`} fill={`url(#${gradient})`} stroke="#f4d4e530" strokeWidth=".4"/>)}
            <circle r="4" fill="#e9cba8"/><circle cx="-1" cy="-1" r="1.3" fill="#fff0ce"/>
        </svg>
    </b>;
}
