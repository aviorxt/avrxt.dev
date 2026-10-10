'use client';

import { useRef } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';

export default function Magnetic({ children }: { children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);
    const prefersReducedMotion = useReducedMotion();
    const x = useSpring(useMotionValue(0), { stiffness: 150, damping: 15, mass: 0.1 });
    const y = useSpring(useMotionValue(0), { stiffness: 150, damping: 15, mass: 0.1 });

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!ref.current || e.pointerType !== 'mouse' || prefersReducedMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
        const { clientX, clientY } = e;
        const { left, top, width, height } = ref.current.getBoundingClientRect();
        
        // Calculate the distance between the center of the element and the mouse
        const centerX = left + width / 2;
        const centerY = top + height / 2;
        
        const offsetX = clientX - centerX;
        const offsetY = clientY - centerY;
        
        // Keep the cursor pull subtle so it does not shift neighboring controls.
        x.set(offsetX * 0.12);
        y.set(offsetY * 0.12);
    };

    const handlePointerLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            style={{ x, y }}
            className="inline-block touch-pan-y"
        >
            {children}
        </motion.div>
    );
}
