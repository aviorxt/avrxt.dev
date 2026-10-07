'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Gallery() {
    const [selectedImg, setSelectedImg] = useState<string | null>(null);

    const images = [
        { id: '001', name: 'Thanjavur', src: 'https://cdn.avxt.qzz.io/images/aviorxt_01.jpg', description: 'When art, architecture, and divinity meet' },
        { id: '003', name: "The Wing's Edge", src: 'https://cdn.avxt.qzz.io/images/aviorxt_03.jpg' },
        { id: '005', name: '@Blue', src: 'https://cdn.avxt.qzz.io/images/aviorxt_05.jpg' },
        { id: '006', name: 'Artifact', src: 'https://cdn.avxt.qzz.io/images/aviorxt_06.jpg' },
    ];

    useEffect(() => {
        if (!selectedImg) return;
        const previousOverflow = document.body.style.overflow;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setSelectedImg(null);
        };
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedImg]);

    return (
        <main className={cn(
            "min-h-screen bg-black text-white relative flex flex-col items-center",
            "font-outfit antialiased select-none"
        )}>
            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-soft-light"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1a1a1a_0%,#000_75%)]"></div>
            </div>

            {/* Lightbox */}
            {selectedImg && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/98 backdrop-blur-3xl transition-opacity duration-500 animate-in fade-in"
                    onClick={() => setSelectedImg(null)}
                >
                    <button type="button" aria-label="Close image viewer" onClick={() => setSelectedImg(null)} className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-[120] flex min-h-11 min-w-11 items-center justify-center text-zinc-300 transition-colors hover:text-white sm:right-8 sm:top-8">
                        <X className="w-8 h-8" />
                    </button>
                    <img
                        src={selectedImg}
                        alt="Vault View"
                        className="max-w-[90%] max-h-[80vh] rounded-sm transform transition-all duration-700 animate-in slide-in-from-bottom-5"
                    />
                </div>
            )}

            {/* Header */}
            <header className="relative z-30 mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-8 sm:pt-12 animate-fade-in">
                <Link href="/" className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all group-hover:bg-white/10">
                        <ArrowLeft className="w-4 h-4 text-zinc-400" />
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-zinc-500">System.Exit</span>
                </Link>
                <div className="flex flex-col items-end">
                    <span className="font-mono text-[10px] text-zinc-600 uppercase">Status</span>
                    <span className="text-[10px] text-emerald-500 font-mono animate-pulse tracking-widest">ENCRYPTED_NODE</span>
                </div>
            </header>

            {/* Content */}
            <section className="relative z-20 mx-auto w-full max-w-6xl px-4 pb-20 pt-14 sm:px-8 sm:pb-32 sm:pt-20">
                <div className="mb-12 animate-fade-in sm:mb-20" style={{ animationDelay: '0.2s' }}>
                    <span className="font-mono text-[9px] uppercase tracking-[.22em] text-zinc-500 sm:text-[11px] sm:tracking-[0.3em]"># Visual_Archive_2025</span>
                    <h1 className="mb-4 text-[clamp(3.5rem,15vw,6rem)] font-black italic uppercase leading-[.9] tracking-tighter sm:mb-6 md:text-8xl" style={{ fontWeight: 900 }}>Vault</h1>
                    <p className="max-w-xl text-base font-light leading-7 text-zinc-400 sm:text-lg sm:leading-relaxed">
                        Secured artifacts from the digital frontier. Previews optimized for high-resolution displays.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:gap-8 md:grid-cols-2 md:gap-10">
                    {images.map((img, i) => (
                        <button
                            type="button"
                            key={img.id}
                            aria-label={`View ${img.name} image`}
                            className="gallery-card group w-full cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-white/[.02] text-left transition-colors hover:border-white/25 animate-fade-in"
                            style={{ animationDelay: `${0.4 + (i * 0.1)}s` }}
                            onClick={() => setSelectedImg(img.src)}
                        >
                            <div className="aspect-[4/3] overflow-hidden sm:aspect-[16/10]">
                                <img
                                    src={img.src}
                                    alt={img.name}
                                    className="w-full h-full object-cover transition-all duration-700 saturate-0 contrast-[1.2] group-hover:scale-105 group-hover:saturate-100 group-hover:contrast-100"
                                />
                            </div>
                            <div className="border-t border-white/5 p-4 sm:p-7">
                                <div>
                                    <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-2">Ref. {img.id}</p>
                                    <h3 className="break-words text-xl font-bold uppercase tracking-tight text-white sm:text-2xl">{img.name}</h3>
                                    {img.description && (
                                    <p className="mt-2 font-accent text-lg italic text-zinc-400 sm:text-xl">{img.description}</p>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                <footer className="mt-20 border-t border-white/5 pt-8 text-center sm:mt-40 sm:pt-12">
                    <p className="font-mono text-[9px] uppercase tracking-[.2em] text-zinc-700 sm:text-[10px] sm:tracking-[0.5em]">&copy; 2026 // AVRXT.DEV // SILO_SECURED</p>
                </footer>
            </section>

            <style jsx>{`
        .font-outfit { font-family: 'Outfit', sans-serif; }
        .font-accent { font-family: 'Instrument Serif', serif; }
      `}</style>
        </main>
    );
}
