'use client';

import { useEffect } from 'react';

/** Progressive decoration: content stays visible without JavaScript. */
export default function GardenMotion() {
    useEffect(() => {
        const root = document.querySelector<HTMLElement>('.garden-home');
        if (!root) return;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
        const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
        const marks = root.querySelectorAll<HTMLElement>('.avrxt-motion-mark');
        const markObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => (entry.target as HTMLElement).dataset.sleeping = String(!entry.isIntersecting));
        });
        marks.forEach(mark => markObserver.observe(mark));
        const visibility = () => marks.forEach(mark => mark.dataset.pageHidden = String(document.hidden));
        document.addEventListener('visibilitychange', visibility);
        const sections = root.querySelectorAll<HTMLElement>('.garden-section-heading, .garden-card, .garden-person, .garden-newsletter, .garden-footer-invitation, .garden-footer-directory');
        const observer = new IntersectionObserver(entries => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-revealed');
                    observer.unobserve(entry.target);
                }
            }
        }, { threshold: 0.08 });
        sections.forEach(element => {
            if (!reduced.matches && element.getBoundingClientRect().top > innerHeight) {
                element.classList.add('garden-reveal');
                observer.observe(element);
            }
        });
        let frame = 0;
        let target: HTMLElement | null = null;
        const reset = () => {
            if (frame) cancelAnimationFrame(frame);
            frame = 0;
            target?.style.removeProperty('--card-rx');
            target?.style.removeProperty('--card-ry');
            target = null;
        };
        const move = (event: PointerEvent) => {
            if (reduced.matches || document.documentElement.dataset.floralPaused === 'true' || !fine.matches || event.pointerType !== 'mouse') return;
            const card = (event.target as Element).closest<HTMLElement>('.garden-card, .garden-intro, .garden-brand, .garden-footer-wordmark');
            if (target !== card) reset();
            target = card;
            if (!card || frame) return;
            const { clientX, clientY } = event;
            frame = requestAnimationFrame(() => {
                frame = 0;
                const bounds = card.getBoundingClientRect();
                const x = (clientX - bounds.left) / bounds.width;
                const y = (clientY - bounds.top) / bounds.height;
                card.style.setProperty('--card-rx', `${(y - .5) * -4}deg`);
                card.style.setProperty('--card-ry', `${(x - .5) * 5}deg`);
                card.style.setProperty('--card-light-x', `${x * 100}%`);
                card.style.setProperty('--card-light-y', `${y * 100}%`);
            });
        };
        const preference = () => {
            reset();
            if (reduced.matches) sections.forEach(element => element.classList.add('is-revealed'));
        };
        root.addEventListener('pointermove', move, { passive: true });
        root.addEventListener('pointerleave', reset);
        reduced.addEventListener('change', preference);
        window.addEventListener('avrxt-motion', preference);
        return () => {
            observer.disconnect();
            markObserver.disconnect();
            document.removeEventListener('visibilitychange', visibility);
            reset();
            sections.forEach(element => element.classList.remove('garden-reveal', 'is-revealed'));
            root.removeEventListener('pointermove', move);
            root.removeEventListener('pointerleave', reset);
            reduced.removeEventListener('change', preference);
            window.removeEventListener('avrxt-motion', preference);
        };
    }, []);
    return null;
}

