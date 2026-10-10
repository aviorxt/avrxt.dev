'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, CircleCheck, CloudOff, Gauge, LoaderCircle, WifiOff, Wrench } from 'lucide-react';
import { apiUrl } from '@/lib/api-gateway';

type StatusValue = 'operational' | 'down' | 'maintenance' | 'unknown' | 'degraded';

type StatusState = {
    status: StatusValue;
    label: string;
};

const statusConfig: Record<StatusValue, {
    eyebrow: string;
    icon: typeof CircleCheck;
    activeBars: number;
    indicator: string;
    iconColor: string;
    iconBorder: string;
    activeBar: string;
    topLine: string;
}> = {
    operational: { eyebrow: 'All systems normal', icon: CircleCheck, activeBars: 8, indicator: 'bg-[#22C55E]', iconColor: 'text-[#4ADE80]', iconBorder: 'border-[#22C55E]/45', activeBar: 'bg-[#22C55E]', topLine: 'via-[#22C55E]' },
    degraded: { eyebrow: 'Service degradation', icon: Gauge, activeBars: 5, indicator: 'bg-[#F59E0B]', iconColor: 'text-[#FBBF24]', iconBorder: 'border-[#F59E0B]/45', activeBar: 'bg-[#F59E0B]', topLine: 'via-[#F59E0B]' },
    maintenance: { eyebrow: 'Planned maintenance', icon: Wrench, activeBars: 4, indicator: 'bg-[#EAB308]', iconColor: 'text-[#FACC15]', iconBorder: 'border-[#EAB308]/45', activeBar: 'bg-[#EAB308]', topLine: 'via-[#EAB308]' },
    down: { eyebrow: 'Service interruption', icon: WifiOff, activeBars: 2, indicator: 'bg-[#EF4444]', iconColor: 'text-[#F87171]', iconBorder: 'border-[#EF4444]/45', activeBar: 'bg-[#EF4444]', topLine: 'via-[#EF4444]' },
    unknown: { eyebrow: 'Telemetry unavailable', icon: CloudOff, activeBars: 1, indicator: 'bg-[#EF4444]', iconColor: 'text-[#F87171]', iconBorder: 'border-[#EF4444]/45', activeBar: 'bg-[#EF4444]', topLine: 'via-[#EF4444]' },
};

const loadingConfig = {
    eyebrow: 'Syncing signal', icon: LoaderCircle, activeBars: 0, indicator: 'bg-[#666666]', iconColor: 'text-[#A3A3A3]', iconBorder: 'border-[#484848]', activeBar: 'bg-[#666666]', topLine: 'via-[#666666]',
};

function isStatusPayload(value: unknown): value is StatusState {
    if (!value || typeof value !== 'object') return false;
    const payload = value as Partial<StatusState>;
    return typeof payload.label === 'string' && ['operational', 'down', 'maintenance', 'unknown', 'degraded'].includes(payload.status || '');
}

export default function StatusBadge() {
    const [data, setData] = useState<StatusState>({ status: 'unknown', label: 'Checking status' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        let lastFetchAt = 0;

        const fetchStatus = async () => {
            try {
                const response = await fetch(apiUrl('/v1/status', '/api/status'), { method: 'GET', cache: 'no-store' });
                if (!response.ok) return;
                const result: unknown = await response.json();
                if (mounted && isStatusPayload(result)) setData(result);
            } catch {
                // Preserve the last confirmed state when telemetry is temporarily unavailable.
            } finally {
                if (mounted) setLoading(false);
            }
        };

        const fetchStatusThrottled = () => {
            const now = Date.now();
            if (lastFetchAt && now - lastFetchAt < 60_000) return;
            lastFetchAt = now;
            void fetchStatus();
        };

        fetchStatusThrottled();
        const interval = window.setInterval(fetchStatusThrottled, 60_000);
        const refreshWhenVisible = () => {
            if (document.visibilityState === 'visible') fetchStatusThrottled();
        };

        document.addEventListener('visibilitychange', refreshWhenVisible);
        window.addEventListener('focus', fetchStatusThrottled);

        return () => {
            mounted = false;
            window.clearInterval(interval);
            document.removeEventListener('visibilitychange', refreshWhenVisible);
            window.removeEventListener('focus', fetchStatusThrottled);
        };
    }, []);

    const current = loading ? loadingConfig : statusConfig[data.status];
    const Icon = current.icon;
    const statusLabel = loading ? 'Checking status' : data.label;

    return (
        <a
            href="https://status.avrxt.dev"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${statusLabel}. View the AVRXT system status page.`}
            className="group relative flex min-h-20 w-full min-w-0 max-w-[18rem] touch-manipulation overflow-hidden border border-[#292929] bg-[#080808] text-left shadow-[0_18px_60px_rgba(0,0,0,.45)] transition-[transform,border-color,background-color] duration-300 hover:-translate-y-0.5 hover:border-[#686868] hover:bg-[#0b0b0b] active:translate-y-0 active:scale-[.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E5E5E5] motion-reduce:transform-none motion-reduce:transition-none sm:w-72"
        >
            <span className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${current.topLine} to-transparent opacity-70`} />
            <span className="relative grid w-12 shrink-0 place-items-center border-r border-[#292929] bg-black min-[380px]:w-14">
                <span className={`absolute size-8 rounded-full opacity-15 blur-md ${current.indicator}`} />
                <span className={`relative grid size-7 place-items-center rounded-full border ${current.iconBorder} ${current.iconColor} ${loading ? 'motion-safe:animate-pulse' : ''}`}>
                    <Icon size={13} strokeWidth={1.8} className={loading ? 'motion-safe:animate-spin' : ''} />
                </span>
            </span>

            <span className="min-w-0 flex-1 px-3 py-3 min-[380px]:px-4">
                <span className="flex items-center justify-between gap-4">
                    <span className="min-w-0">
                        <span className="block font-mono text-[7px] uppercase tracking-[.22em] text-[#666666]">System telemetry / Live</span>
                        <span aria-live="polite" className="mt-1 block truncate text-xs font-semibold tracking-[-.01em] text-[#F7F7F7]">{statusLabel}</span>
                    </span>
                    <ArrowUpRight size={13} className="shrink-0 text-[#666666] transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
                </span>

                <span className="mt-3 flex items-end justify-between gap-4 border-t border-[#1F1F1F] pt-2.5">
                    <span className="flex items-center gap-1" aria-hidden="true">
                        {Array.from({ length: 8 }, (_, index) => (
                            <span
                                key={index}
                                className={`w-1 transition-colors duration-500 ${index < current.activeBars ? current.activeBar : 'bg-[#292929]'}`}
                                style={{ height: `${5 + ((index * 3) % 7)}px` }}
                            />
                        ))}
                    </span>
                    <span className={`truncate text-right font-mono text-[7px] uppercase tracking-[.12em] min-[380px]:tracking-[.16em] ${loading ? 'text-[#666666]' : current.iconColor}`}>{current.eyebrow}</span>
                </span>
            </span>

            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[.025] to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        </a>
    );
}
