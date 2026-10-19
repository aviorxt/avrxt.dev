'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowUpRight, CircleCheck, CloudOff, Gauge, LoaderCircle, WifiOff, Wrench } from 'lucide-react';
import { apiUrl } from '@/lib/api-gateway';

type StatusValue = 'operational' | 'down' | 'maintenance' | 'unknown' | 'degraded';

type StatusState = {
    status: StatusValue;
    label: string;
};

const STATUS_CACHE_KEY = 'avrxt:status-badge:v1';
const STATUS_REFRESH_MS = 5 * 60_000;

type CachedStatus = StatusState & { fetchedAt: number };

const statusConfig: Record<StatusValue, {
    badge: string;
    icon: typeof CircleCheck;
    dot: string;
    iconColor: string;
    iconSurface: string;
    badgeSurface: string;
}> = {
    operational: { badge: 'Online', icon: CircleCheck, dot: 'bg-emerald-400', iconColor: 'text-emerald-300', iconSurface: 'border-emerald-400/20 bg-emerald-400/10', badgeSurface: 'border-emerald-400/20 bg-emerald-400/10' },
    degraded: { badge: 'Degraded', icon: Gauge, dot: 'bg-amber-400', iconColor: 'text-amber-300', iconSurface: 'border-amber-400/20 bg-amber-400/10', badgeSurface: 'border-amber-400/20 bg-amber-400/10' },
    maintenance: { badge: 'Maintenance', icon: Wrench, dot: 'bg-sky-400', iconColor: 'text-sky-300', iconSurface: 'border-sky-400/20 bg-sky-400/10', badgeSurface: 'border-sky-400/20 bg-sky-400/10' },
    down: { badge: 'Offline', icon: WifiOff, dot: 'bg-red-400', iconColor: 'text-red-300', iconSurface: 'border-red-400/20 bg-red-400/10', badgeSurface: 'border-red-400/20 bg-red-400/10' },
    unknown: { badge: 'Unknown', icon: CloudOff, dot: 'bg-zinc-500', iconColor: 'text-zinc-300', iconSurface: 'border-zinc-500/20 bg-zinc-500/10', badgeSurface: 'border-zinc-500/20 bg-zinc-500/10' },
};

const loadingConfig = {
    badge: 'Checking', icon: LoaderCircle, dot: 'bg-zinc-500', iconColor: 'text-zinc-300', iconSurface: 'border-zinc-500/20 bg-zinc-500/10', badgeSurface: 'border-zinc-500/20 bg-zinc-500/10',
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

        const readCachedStatus = (): CachedStatus | null => {
            try {
                const cached: unknown = JSON.parse(window.sessionStorage.getItem(STATUS_CACHE_KEY) || 'null');
                if (!cached || typeof cached !== 'object') return null;
                const value = cached as Partial<CachedStatus>;
                const fetchedAt = (cached as { fetchedAt?: unknown }).fetchedAt;
                return isStatusPayload(value) && typeof fetchedAt === 'number' ? { ...value, fetchedAt } : null;
            } catch {
                return null;
            }
        };

        const cached = readCachedStatus();
        if (cached && Date.now() - cached.fetchedAt < STATUS_REFRESH_MS) {
            setData(cached);
            setLoading(false);
            lastFetchAt = cached.fetchedAt;
        }

        const fetchStatus = async () => {
            try {
                const response = await fetch(apiUrl('/v1/status', '/api/status'), { method: 'GET', cache: 'no-store' });
                if (!response.ok) return;
                const result: unknown = await response.json();
                if (isStatusPayload(result)) {
                    const next = { ...result, fetchedAt: Date.now() };
                    try { window.sessionStorage.setItem(STATUS_CACHE_KEY, JSON.stringify(next)); } catch { /* Storage is optional. */ }
                    if (mounted) setData(next);
                }
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

        if (!cached || Date.now() - cached.fetchedAt >= STATUS_REFRESH_MS) fetchStatusThrottled();
        const interval = window.setInterval(fetchStatusThrottled, STATUS_REFRESH_MS);
        const refreshWhenVisible = () => {
            if (document.visibilityState === 'visible' && Date.now() - lastFetchAt >= STATUS_REFRESH_MS) fetchStatusThrottled();
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
        <Link
            href="/status"
            prefetch={false}
            aria-label={`${statusLabel}. View the AVRXT system status page.`}
            className="group flex w-full min-w-0 max-w-[18rem] touch-manipulation items-center gap-3 rounded-xl border border-white/10 bg-zinc-950/70 p-2.5 text-left shadow-[0_10px_30px_rgba(0,0,0,.24)] backdrop-blur-sm transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-zinc-900/90 active:translate-y-0 active:scale-[.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transform-none motion-reduce:transition-none sm:w-72"
        >
            <span className={`grid size-9 shrink-0 place-items-center rounded-lg border ${current.iconSurface} ${current.iconColor}`}>
                <Icon size={16} strokeWidth={1.8} className={loading ? 'motion-safe:animate-spin' : ''} />
            </span>

            <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[8px] uppercase tracking-[.16em] text-zinc-500">System status</span>
                    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[.1em] ${current.badgeSurface} ${current.iconColor}`}>
                        <span className={`size-1.5 rounded-full ${current.dot} ${loading ? 'motion-safe:animate-pulse' : ''}`} />
                        {current.badge}
                    </span>
                </span>
                <span className="mt-1 flex min-w-0 items-center gap-2">
                    <span aria-live="polite" className="truncate text-xs font-medium tracking-[-.01em] text-zinc-100">{statusLabel}</span>
                    <ArrowUpRight size={13} aria-hidden="true" className="shrink-0 text-zinc-600 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
                </span>
            </span>
        </Link>
    );
}
