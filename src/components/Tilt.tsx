'use client';

import React, { useRef, useCallback } from 'react';

interface TiltProps {
    children: React.ReactNode;
    className?: string;
    intensity?: number;
}

export default function Tilt({ children, className, intensity = 10 }: TiltProps) {
    const cardRef = useRef<HTMLDivElement>(null);

    const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (!cardRef.current || e.pointerType !== 'mouse' || !window.matchMedia('(hover: hover) and (pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        
        const card = cardRef.current;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -intensity;
        const rotateY = ((x - centerX) / centerX) * intensity;
        
        card.style.transition = 'transform 100ms ease-out';
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015, 1.015, 1.015)`;
    }, [intensity]);

    const onPointerLeave = useCallback(() => {
        if (!cardRef.current) return;
        cardRef.current.style.transition = 'transform 420ms cubic-bezier(.2,.75,.25,1)';
        cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    }, []);

    return (
        <div
            ref={cardRef}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            className={className}
        >
            {children}
        </div>
    );
}
