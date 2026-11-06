"use client";

import { useEffect, useRef, useState, type CSSProperties } from 'react';
const flowers = [
    {x:220,y:233,size:.66,paint:'pink',delay:-1},
    {x:445,y:220,size:.38,paint:'cyan',delay:-3},
    {x:495,y:350,size:.48,paint:'pink',delay:-1.7},
    {x:120,y:385,size:.4,paint:'cyan',delay:-4},
    {x:370,y:405,size:.53,paint:'coral',delay:-2},
    {x:191,y:488,size:.27,paint:'pink',delay:-5},
];
const wordmark = [{letter:'A',x:88},{letter:'V',x:174},{letter:'R',x:260},{letter:'X',x:346},{letter:'T',x:432}];
const palettes = {pink:['#ffe6ff','#f49cde','#b85de5','#5430a1','#160b32'],cyan:['#e0fffe','#75e9eb','#4486d3','#433197','#100d2b'],coral:['#fff1c9','#ffc0a1','#ee75ae','#853a9f','#210e3b']};
function Flower({flower}:{flower:typeof flowers[number]}) {
    return <g transform={`translate(${flower.x} ${flower.y}) scale(${flower.size})`} style={{'--bloom-delay':`${flower.delay}s`} as CSSProperties}><g className="bloom-flower-float"><g className="bloom-head">
        {[{count:15,scale:1,offset:0},{count:11,scale:.76,offset:12},{count:7,scale:.5,offset:4}].map((layer,k)=><g key={k} transform={`scale(${layer.scale})`}><g className="bloom-layer" style={{'--petal-delay':`${k*-.7+flower.delay}s`} as CSSProperties}>
            {Array.from({length:layer.count},(_,i)=><g key={i} transform={`rotate(${i*360/layer.count+layer.offset})`}>
                <path d="M0 12 C-14 -12 -25 -59 -20 -105 C-17 -132 12 -137 22 -112 C35 -72 17 -14 0 12Z" fill={`url(#floral-${flower.paint})`} stroke="#ffffff35" strokeWidth=".8" />
                <path d="M0 12 C-14 -12 -25 -59 -20 -105 C-17 -132 12 -137 22 -112 C35 -72 17 -14 0 12Z" fill="url(#floral-petal-volume)" />
                <path d="M-3 -8 Q-16 -55 -12 -109 M5 -11 Q20 -61 14 -111 M-1 -20 Q-7 -70 -4 -119" stroke="#fff" strokeOpacity=".12" strokeWidth=".6"/>
                <path d="M0 12 Q6 -54 2 -120" stroke="#ffffff30" strokeWidth=".7" />
            </g>)}
        </g></g>)}
        <circle r="17" fill="url(#floral-heart)" />
        {Array.from({length:18},(_,i)=><circle key={i} cx={(Math.cos(i*2.39996)*Math.sqrt(i)*3.2).toFixed(4)} cy={(Math.sin(i*2.39996)*Math.sqrt(i)*3.2).toFixed(4)} r="1.3" fill={i%3?'#ffe6a1':'#bf7d38'} />)}
    </g></g></g>;
}
export default function HomeBloom(){
    const [paused,setPaused]=useState(false);
    useEffect(()=>{
        const receive=(event:Event)=>setPaused(Boolean((event as CustomEvent<boolean>).detail));
        window.addEventListener('avrxt-motion',receive);
        return ()=>window.removeEventListener('avrxt-motion',receive);
    },[]);
    const artRef=useRef<HTMLDivElement>(null);
    const pointerFrame=useRef<number | null>(null);
    const pointer=useRef({x:0,y:0});
    const [inView,setInView]=useState(true);
    const [pageVisible,setPageVisible]=useState(true);
    useEffect(()=>{
        const art=artRef.current;
        const observer=new IntersectionObserver(([entry])=>setInView(entry.isIntersecting),{rootMargin:'80px'});
        if(art) observer.observe(art);
        const updateVisibility=()=>setPageVisible(!document.hidden);
        updateVisibility();
        document.addEventListener('visibilitychange',updateVisibility);
        return ()=>{observer.disconnect();document.removeEventListener('visibilitychange',updateVisibility);if(pointerFrame.current!==null) cancelAnimationFrame(pointerFrame.current);};
    },[]);
    return <figure className="home-bloom" data-paused={paused || !inView || !pageVisible}>
        <div className="bloom-art" ref={artRef} role="img" aria-label="Animated flowers around the AVRXT wordmark"
        onPointerMove={event=>{
            if(paused || event.pointerType!=='mouse' || !window.matchMedia('(hover: hover) and (pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            pointer.current={x:event.clientX,y:event.clientY};
            if(pointerFrame.current!==null) return;
            pointerFrame.current=requestAnimationFrame(()=>{
                pointerFrame.current=null;
                const art=artRef.current;
                if(!art) return;
                const box=art.getBoundingClientRect();
                art.style.setProperty('--bloom-depth-x',`${((pointer.current.x-box.left)/box.width-.5)*18}px`);
                art.style.setProperty('--bloom-depth-y',`${((pointer.current.y-box.top)/box.height-.5)*12}px`);
                art.style.setProperty('--bloom-tilt-y',`${((pointer.current.x-box.left)/box.width-.5)*6}deg`);
                art.style.setProperty('--bloom-tilt-x',`${((pointer.current.y-box.top)/box.height-.5)*-5}deg`);
                art.style.setProperty('--light-x',`${(pointer.current.x-box.left)/box.width*100}%`);
                art.style.setProperty('--light-y',`${(pointer.current.y-box.top)/box.height*100}%`);
            });
        }} onPointerLeave={()=>{
            if(pointerFrame.current!==null) cancelAnimationFrame(pointerFrame.current);
            pointerFrame.current=null;
            artRef.current?.style.setProperty('--bloom-depth-x','0px');
            artRef.current?.style.setProperty('--bloom-depth-y','0px');
            artRef.current?.style.setProperty('--bloom-tilt-x','0deg');
            artRef.current?.style.setProperty('--bloom-tilt-y','0deg');
        }}>
            <div className="bloom-camera">
            <div className="bloom-aura" aria-hidden="true" />
            <div className="bloom-silk-light" aria-hidden="true" />
            <div className="bloom-mist" />
            <div className="bloom-particles">{Array.from({length:8},(_,i)=><span key={i} style={{'--particle-angle':`${i*45}deg`,'--particle-delay':`${i*-.65}s`,'--particle-color':['#dd85ff','#78f6ed','#ffb891'][i%3]} as CSSProperties}/>)}</div>
            <svg aria-hidden="true" viewBox="20 110 560 450" fill="none" className="bloom-svg">
                <defs>
                    <linearGradient id="floral-petal-volume" x1="-24" y1="0" x2="28" y2="0" gradientUnits="userSpaceOnUse"><stop stopColor="#271335" stopOpacity=".55"/><stop offset=".35" stopColor="#fff" stopOpacity=".03"/><stop offset=".57" stopColor="#fff" stopOpacity=".38"/><stop offset=".75" stopColor="#fff" stopOpacity=".02"/><stop offset="1" stopColor="#291637" stopOpacity=".4"/></linearGradient>
                    <linearGradient id="floral-leaf-volume" x1="-50" y1="-55" x2="0" y2="0" gradientUnits="userSpaceOnUse"><stop stopColor="#9cb995"/><stop offset=".45" stopColor="#477b62"/><stop offset=".5" stopColor="#305941"/><stop offset="1" stopColor="#152f25"/></linearGradient>
                    <linearGradient id="floral-type-face" x1="0" y1="250" x2="0" y2="390" gradientUnits="userSpaceOnUse"><stop stopColor="#fff"/><stop offset=".48" stopColor="#fff7ff"/><stop offset="1" stopColor="#bab6d4"/></linearGradient>
                    <linearGradient id="floral-shine"><stop stopColor="#fff" stopOpacity="0"/><stop offset=".46" stopColor="#d5fbff" stopOpacity="0"/><stop offset=".5" stopColor="#fff" stopOpacity=".9"/><stop offset=".54" stopColor="#ffe6ff" stopOpacity="0"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient>
                    <clipPath id="floral-letter-clip">{wordmark.map(({letter,x})=><text key={letter} x={x} y="375" fontFamily="var(--font-outfit), sans-serif" fontSize="132" fontWeight="800">{letter}</text>)}</clipPath>
                    {wordmark.map(({letter,x})=><clipPath key={letter} id={`floral-glyph-${letter}`}><text x={x} y="375" fontFamily="var(--font-outfit), sans-serif" fontSize="132" fontWeight="800">{letter}</text></clipPath>)}
                    {Object.entries(palettes).map(([name,colors])=><linearGradient key={name} id={`floral-${name}`} x1="-22" y1="-130" x2="25" y2="12" gradientUnits="userSpaceOnUse">{colors.map((color,i)=><stop key={color} offset={i/4} stopColor={color}/>)}</linearGradient>)}
                    <radialGradient id="floral-heart"><stop stopColor="#fff5b4"/><stop offset=".7" stopColor="#deb366"/><stop offset="1" stopColor="#714827"/></radialGradient>
                </defs>
                <g className="bloom-desktop-atmosphere" aria-hidden="true">
                    <path className="bloom-light-trail bloom-light-trail-one" d="M55 395 C100 150 390 100 535 235 C625 345 440 535 205 510" stroke="#bfe8f1" strokeOpacity=".5" strokeWidth=".8" strokeLinecap="round" />
                    <path className="bloom-light-trail bloom-light-trail-two" d="M90 235 C255 100 560 290 510 435 C430 600 70 465 85 310" stroke="#e8b3e9" strokeOpacity=".4" strokeWidth=".7" strokeLinecap="round" />
                    {Array.from({length:7},(_,i)=><g key={i} transform={`translate(${80+i*70} ${150+(i%3)*115})`}><path className="bloom-sparkle" style={{'--sparkle-delay':`${i*-.9}s`} as CSSProperties} d="M0 -5 Q0 0 5 0 Q0 0 0 5 Q0 0 -5 0 Q0 0 0 -5Z" fill={i%2?'#c6faff':'#ffe1f7'}/></g>)}
                    {Array.from({length:5},(_,i)=><g key={i} transform={`translate(${120+i*88} 160)`}><path className="bloom-air-petal" style={{'--air-delay':`${i*-2.3}s`,'--air-drift':`${i%2?32:-30}px`} as CSSProperties} d="M0 0 C-13 -8 -15 -20 0 -26 C10 -15 9 -5 0 0Z" fill={`url(#floral-${i%2?'cyan':'pink'})`}/></g>)}
                </g>
                <g className="bloom-arrangement">
                    <path className="bloom-vine" d="M92 475 Q124 310 220 220 Q324 156 454 223 M135 452 Q320 530 502 345" stroke="#90c9a0" strokeOpacity=".4" strokeWidth="2"/>
                    {[{x:174,y:247,r:-38},{x:330,y:198,r:28},{x:438,y:268,r:124},{x:195,y:474,r:-70},{x:458,y:415,r:55}].map((leaf,i)=><g key={i} transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.r})`}><g className="bloom-leaf" style={{'--bloom-delay':`${i*-.5}s`} as CSSProperties}><path d="M0 0 Q-50 -14 -53 -64 Q-10 -57 0 0Z" fill="url(#floral-leaf-volume)"/><path d="M0 0 L-46 -55" stroke="#b0e2bd" strokeOpacity=".35"/></g></g>)}
                    <g className="bloom-depth-back">{flowers.slice(0,3).map((flower,i)=><Flower key={i} flower={flower}/>)}</g>
                    <g className="bloom-lettering" fontFamily="var(--font-outfit), sans-serif" fontSize="132" fontWeight="800" letterSpacing="0" textAnchor="start">
                        {wordmark.map(({letter,x},index)=><g key={letter} className="bloom-glyph" style={{'--glyph-delay':`${index*.22}s`,transformOrigin:`${x+38}px 335px`} as CSSProperties}>
                            <text x={x} y="375" fill="#282035" transform="translate(0 9)">{letter}</text>
                            <text x={x} y="375" fill="#807286" transform="translate(0 4)">{letter}</text>
                            <text x={x} y="375" fill="url(#floral-type-face)">{letter}</text>
                            <text className="bloom-glyph-edge" x={x} y="375" fill="none" stroke="#e2faff" strokeWidth=".7">{letter}</text>
                            <g className="bloom-glyph-shine" clipPath={`url(#floral-glyph-${letter})`}><rect className="bloom-type-shine" x="-600" y="200" width="900" height="220" fill="url(#floral-shine)"/></g>
                        </g>)}
                        <g className="bloom-mobile-shine" clipPath="url(#floral-letter-clip)"><rect className="bloom-type-shine" x="-600" y="200" width="900" height="220" fill="url(#floral-shine)"/></g>
                    </g>
                    <g className="bloom-depth-front">{flowers.slice(3).map((flower,i)=><Flower key={i} flower={flower}/>)}</g>
                </g>
            </svg>
            </div>
            <span aria-hidden="true" className="bloom-coordinate bloom-coordinate-top">Organic / digital</span>
            <span className="bloom-coordinate bloom-coordinate-bottom">Always becoming.</span>
        </div>
        <figcaption className="bloom-caption"><span><span className="bloom-caption-number">Study 001</span> / Chromatic bloom</span><button type="button" aria-pressed={paused} onClick={()=>window.dispatchEvent(new CustomEvent('avrxt-motion',{detail:!paused}))} className="bloom-motion-label">{paused?'Resume motion':'Pause motion'} <span aria-hidden="true">&#8599;</span></button></figcaption>
    </figure>;
}


