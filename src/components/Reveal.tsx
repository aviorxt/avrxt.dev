'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface RevealProps {
    children: React.ReactNode;
    className?: string;
    id?: string;
    style?: React.CSSProperties;
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right';
}

export default function Reveal({ children, className, id, style, delay = 0, direction = 'up' }: RevealProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [canAnimate, setCanAnimate] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        const rect = element.getBoundingClientRect();
        const startsBelowViewport = rect.top > window.innerHeight * 0.92;
        if (startsBelowViewport) {
            setCanAnimate(true);
            setIsVisible(false);
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.06, rootMargin: '0px 0px 80px 0px' }
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, []);

    return (
        <div
            id={id}
            ref={ref}
            style={{
                ...style,
                transitionDelay: `${delay}s`
            }}
            className={cn(
                "reveal",
                `reveal-${direction}`,
                isVisible && "active",
                canAnimate && "reveal-ready",
                className
            )}
        >
            {children}
        </div>
    );
}
