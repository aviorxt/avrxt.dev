'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, ArrowUpRight, Check, Clock3, Radio, ShieldCheck, Wrench, AlertTriangle, ChevronDown, Globe2, Database, Server, KeyRound, Layers3, CircleCheck } from 'lucide-react';
import Reveal from '@/components/Reveal';
import { historyWindow, unavailableStatus, type ServiceState, type StatusSnapshot, type StatusResource, type StatusReport } from '@/lib/status-model';
import { apiUrl } from '@/lib/api-gateway';

const labels: Record<ServiceState, string> = { operational: 'Operational', degraded: 'Degraded', down: 'Disruption', maintenance: 'Maintenance', unknown: 'Unavailable' };
function timestamp(value: string | null) {
  if (!value) return 'Time unavailable';
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(new Date(value)) + ' IST';
}
function duration(seconds: number) {
  if (!seconds) return 'none';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.round(seconds / 60);
  return minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
function StatusLabel({ status }: { status: ServiceState }) {
  return <span className={`status-label status-tone-${status}`}><span className="status-dot" />{labels[status]}</span>;
}
function ResourceCard({ resource, days, checkedAt }: { resource: StatusResource; days: 30 | 90; checkedAt: string }) {
  const history = historyWindow(resource.history, days, new Date(checkedAt));
  const [selected, setSelected] = useState<string | null>(null);
  const foundIndex = history.findIndex(day => day.day === selected);
  const currentIndex = foundIndex < 0 ? history.length - 1 : foundIndex;
  const detail = selected ? history[currentIndex] : history[history.length - 1];
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const Icon = /database/i.test(resource.name) ? Database : /auth/i.test(resource.name) ? KeyRound : /web/i.test(resource.name) ? Globe2 : /gateway/i.test(resource.name) ? Layers3 : resource.automatic ? Server : Radio;
  return <article className={`status-monitor status-tone-${resource.status} group`}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3"><span className="status-monitor-icon"><Icon size={19} /></span><div className="min-w-0"><h3 className="break-words text-base font-semibold tracking-tight text-zinc-100">{resource.name}</h3><p className="mt-1 font-mono text-[9px] uppercase tracking-[.14em] text-zinc-500">{resource.automatic ? resource.section : 'Manual dependency'}</p></div></div>
      <div className="flex flex-col items-end gap-2"><StatusLabel status={resource.status} /><span className="status-uptime">{resource.uptime !== null ? <><strong>{resource.uptime.toFixed(2)}<small>%</small></strong><span>Reported uptime</span></> : <span>Not measured</span>}</span></div>
    </div>
    {resource.description && <details className="status-monitor-details mt-4"><summary>Service details <ChevronDown size={11} /></summary><p>{resource.description}</p></details>}
    {resource.automatic ? <><div className="status-history-bars mt-6" role="group" aria-label={`${resource.name}: ${days} days of status history`} style={{ gridTemplateColumns: `repeat(${days},minmax(0,1fr))` }}>
      {history.map((day, index) => <button key={day.day} ref={element => { buttons.current[index] = element; }} type="button" tabIndex={day.day === detail.day ? 0 : -1} aria-label={`${day.day}: ${day.monitored ? labels[day.status] : 'Not monitored'}, downtime ${duration(day.downtime)}, maintenance ${duration(day.maintenance)}`} aria-pressed={selected === day.day} title={`${day.day} · ${day.monitored ? labels[day.status] : 'Not monitored'}`} onMouseEnter={() => setSelected(day.day)} onFocus={() => setSelected(day.day)} onClick={() => setSelected(day.day)} onKeyDown={event => {
        const next = event.key === 'ArrowLeft' ? Math.max(0, index - 1) : event.key === 'ArrowRight' ? Math.min(days - 1, index + 1) : event.key === 'Home' ? 0 : event.key === 'End' ? days - 1 : null;
        if (next !== null) { event.preventDefault(); buttons.current[next]?.focus(); }
      }} className={`status-day status-tone-${day.monitored ? day.status : 'unknown'} ${day.day === detail.day ? 'is-selected' : ''}`} />)}
    </div>
    <div className="mt-2 flex justify-between font-mono text-[9px] text-zinc-600"><span>{history[0].day}</span><span>Today</span></div>
    <div className="status-day-detail mt-3 flex flex-wrap justify-between gap-2 font-mono text-[9px] leading-relaxed text-zinc-500"><span>{detail.day} · {detail.monitored ? labels[detail.status] : 'Not monitored'}</span><span>Downtime {duration(detail.downtime)} · Maintenance {duration(detail.maintenance)}</span></div></> : <p className="mt-6 border-t border-white/10 pt-4 text-xs leading-relaxed text-zinc-600">This service is manually maintained. Automated uptime measurements and monitoring history are not available.</p>}
  </article>;
}
function ReportCard({ report }: { report: StatusReport }) {
  return <details className="status-report group">
    <summary className="flex cursor-pointer list-none items-start gap-4 p-5 sm:p-6"><span className={`status-report-icon status-tone-${report.phase === 'resolved' || report.phase === 'completed' ? 'operational' : report.kind === 'maintenance' ? 'maintenance' : report.status}`}>{report.kind === 'maintenance' ? <Wrench size={17} /> : <AlertTriangle size={17} />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-3"><h3 className="break-words text-sm font-semibold text-zinc-100">{report.title}</h3><span className="status-phase">{report.phase}</span></div><p className="mt-2 font-mono text-[10px] leading-relaxed text-zinc-500">{timestamp(report.startsAt)}{report.endsAt ? ` → ${timestamp(report.endsAt)}` : ''}</p>{report.affected.length > 0 && <p className="mt-2 text-xs text-zinc-500">{report.affected.join(' · ')}</p>}</div><ChevronDown size={16} className="mt-1 shrink-0 text-zinc-600 transition-transform group-open:rotate-180 motion-reduce:transition-none" /></summary>
    <div className="mx-5 border-t border-white/10 pb-5 pt-5 sm:mx-6"><ol className="space-y-6">{report.updates.map((update, index) => <li key={`${update.at}:${index}`} className="border-l border-white/15 pl-4"><p className="font-mono text-[10px] text-zinc-600">{timestamp(update.at)}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-400">{update.message || 'No message published.'}</p></li>)}</ol>{report.updates.length === 0 && <p className="text-sm text-zinc-500">No public timeline updates have been published for this report.</p>}</div>
  </details>;
}
function AvailabilityChart({ resources, checkedAt }: { resources: StatusResource[]; checkedAt: string }) {
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const [selected, setSelected] = useState<string | null>(null);
  const monitored = resources.filter(resource => resource.automatic);
  const days = Array.from({ length: range }, (_, index) => {
    const day = new Date(Date.UTC(new Date(checkedAt).getUTCFullYear(), new Date(checkedAt).getUTCMonth(), new Date(checkedAt).getUTCDate() - range + index + 1)).toISOString().slice(0, 10);
    const states = monitored.map(resource => resource.history.find(item => item.day === day)).filter((item): item is NonNullable<typeof item> => Boolean(item?.monitored));
    const availability = states.length ? Math.round((states.filter(item => item.status === 'operational').length / states.length) * 1000) / 10 : null;
    const severity: Record<ServiceState, number> = { unknown: 0, operational: 1, maintenance: 2, degraded: 3, down: 4 };
    const state = states.reduce<ServiceState>((worst, item) => severity[item.status] > severity[worst] ? item.status : worst, 'unknown');
    return { day, availability, samples: states.length, state };
  });
  const active = days.find(item => item.day === selected) || days[days.length - 1];
  const width = 720, height = 208, inset = 16;
  const usableWidth = width - inset * 2, usableHeight = height - inset * 2;
  const points = days.map((item, index) => ({ ...item, x: inset + (index / Math.max(days.length - 1, 1)) * usableWidth, y: inset + (1 - (item.availability ?? 0) / 100) * usableHeight }));
  const segments: (typeof points)[] = [];
  points.forEach((point, index) => {
    if (point.availability === null) return;
    if (points[index - 1]?.availability === null || segments.length === 0) segments.push([point]);
    else segments[segments.length - 1].push(point);
  });
  const coloredLines = points.flatMap((point, index) => {
    const previous = points[index - 1];
    if (!previous || point.availability === null || previous.availability === null) return [];
    return [{ state: point.state, d: `M${previous.x.toFixed(2)},${previous.y.toFixed(2)} L${point.x.toFixed(2)},${point.y.toFixed(2)}` }];
  });
  const rangeLabel = range === 7 ? 'Last 7 days' : range === 30 ? 'Last 30 days' : 'Last 90 days';
  return <section className="status-chart mt-7 overflow-hidden rounded-xl border border-white/10 bg-zinc-950/70 shadow-[0_16px_50px_rgba(0,0,0,.22)]" aria-labelledby="availability-chart-title">
    <div className="flex flex-wrap items-center gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
      <div className="min-w-0 flex-1"><p className="status-kicker">Live monitor history</p><h2 id="availability-chart-title" className="mt-1 text-base font-semibold tracking-tight text-zinc-100">Service availability</h2><p className="mt-1 text-xs text-zinc-500">Daily share of monitored services reporting operational. Line colour reflects the most severe observed service state.</p><div className="status-chart-legend mt-3" aria-label="Availability colour legend">{(['operational', 'degraded', 'down', 'maintenance', 'unknown'] as const).map(status => <span key={status} className={`status-tone-${status}`}><span />{status === 'unknown' ? 'No data' : labels[status]}</span>)}</div></div>
      <div className="status-period" role="group" aria-label="Availability chart period">{([7, 30, 90] as const).map(period => <button key={period} aria-pressed={range === period} onClick={() => { setRange(period); setSelected(null); }}>{period}d</button>)}</div>
    </div>
    <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_10rem]">
      <div className="min-w-0"><div className="relative h-56 w-full" role="group" aria-label={`${rangeLabel} availability chart`}>
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-full w-full overflow-visible" aria-hidden="true">
          {[0, 50, 100].map(value => <line key={value} x1={inset} x2={width - inset} y1={inset + (1 - value / 100) * usableHeight} y2={inset + (1 - value / 100) * usableHeight} stroke="rgba(255,255,255,.10)" strokeDasharray="3 4" />)}
          {segments.map((segment, index) => segment.length === 1 ? <circle key={`dot-${index}`} cx={segment[0].x} cy={segment[0].y} r="2.4" className={`status-chart-dot status-tone-${segment[0].state}`} /> : null)}
          {coloredLines.map((line, index) => <path key={`${line.d}:${index}`} d={line.d} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" className={`status-chart-line status-tone-${line.state}`} />)}
        </svg>
        <div className="absolute inset-0 flex" aria-hidden="false">{points.map(point => <button key={point.day} type="button" onMouseEnter={() => setSelected(point.day)} onFocus={() => setSelected(point.day)} onClick={() => setSelected(point.day)} aria-label={`${point.day}: ${point.availability === null ? 'No monitoring data' : `${point.availability}% availability across ${point.samples} services`}`} className="h-full flex-1 rounded-sm focus-visible:outline focus-visible:outline-1 focus-visible:outline-emerald-300" />)}</div>
      </div><div className="flex justify-between px-1 font-mono text-[9px] text-zinc-600"><span>{days[0]?.day}</span><span>Today</span></div></div>
      <aside className="rounded-lg border border-white/10 bg-white/[0.025] p-4"><p className="font-mono text-[9px] uppercase tracking-[.14em] text-zinc-500">Selected day</p><p className="mt-3 text-xl font-semibold tracking-tight text-zinc-100">{active?.availability === null ? '—' : `${active?.availability}%`}</p><p className="mt-1 text-xs text-zinc-500">{active?.availability === null ? 'No monitoring data' : `${active.samples} services observed`}</p>{active?.availability !== null && <StatusLabel status={active.state} />}<p className="mt-5 border-t border-white/10 pt-4 font-mono text-[10px] text-zinc-400">{active?.day || '—'}</p><p className="mt-2 text-[10px] leading-relaxed text-zinc-600">Gaps are not treated as uptime. Hover, focus, or tap the chart to inspect a day.</p></aside>
    </div>
  </section>;
}

export default function StatusClient({ initial }: { initial: StatusSnapshot }) {
  const [snapshot, setSnapshot] = useState(initial);
  const [refreshing, setRefreshing] = useState(false);
  const [days, setDays] = useState<30 | 90>(90);
  const [filter, setFilter] = useState<'all' | 'incident' | 'maintenance'>('all');
  const request = useRef<AbortController | null>(null);
  const lastRequest = useRef(0);
  const refresh = useCallback(async () => {
    if (request.current || Date.now() - lastRequest.current < 5000) return;
    lastRequest.current = Date.now();
    const controller = new AbortController();
    request.current = controller;
    setRefreshing(true);
    const deadline = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(apiUrl('/v1/status/details', '/api/status/details'), { cache: 'default', credentials: 'omit', signal: controller.signal });
      if (!response.ok) throw new Error('Status source unavailable');
      const next = await response.json() as StatusSnapshot;
      if (!Array.isArray(next.resources) || !Array.isArray(next.reports) || !Number.isFinite(Date.parse(next.checkedAt)) || !Object.hasOwn(labels, next.status)) throw new Error('Invalid status response');
      setSnapshot(next);
    } catch { if (request.current === controller) setSnapshot(unavailableStatus()); }
    finally { clearTimeout(deadline); if (request.current === controller) { request.current = null; setRefreshing(false); } }
  }, []);
  useEffect(() => {
    const interval = setInterval(() => { if (document.visibilityState === 'visible') void refresh(); }, 5 * 60_000);
    const visible = () => { if (document.visibilityState === 'visible') void refresh(); };
    document.addEventListener('visibilitychange', visible);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', visible); const controller = request.current; request.current = null; controller?.abort(); };
  }, [refresh]);
  const active = snapshot.reports.filter(report => report.kind === 'incident' && report.phase === 'active');
  const maintenance = snapshot.reports.filter(report => report.kind === 'maintenance' && ['active', 'upcoming'].includes(report.phase));
  const past = snapshot.reports.filter(report => !active.includes(report) && !maintenance.includes(report));
  const history = past.filter(report => filter === 'all' || report.kind === filter);
  const monitors = snapshot.resources.filter(resource => resource.automatic);
  const dependencies = snapshot.resources.filter(resource => !resource.automatic);
  const operational = snapshot.resources.filter(resource => resource.status === 'operational').length;

  return <div className="status-page status-dashboard mx-auto max-w-7xl px-5 pb-20 pt-28 sm:px-8 sm:pt-28">
    <Reveal><header className="status-dashboard-header">
      <div><p className="status-kicker flex items-center gap-2"><span className="status-header-mark"><Radio size={12} /></span>AVRXT NETWORK <span className="text-zinc-700">/</span> PUBLIC STATUS</p><h1 className="mt-5 text-[clamp(40px,6vw,62px)] font-black leading-[.95] tracking-[-.055em] text-white">System status<span className="text-zinc-600">.</span></h1><p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-500">Availability, continuity, and a transparent record of the systems behind AVRXT.</p></div>
      <a href="https://status.avrxt.dev" target="_blank" rel="noreferrer" className="status-external-link">Independent status <ArrowUpRight size={14} /></a>
    </header></Reveal>
    <Reveal delay={.06}><section aria-label="Overall system status" className={`status-overview status-tone-${snapshot.status} mt-8`}>
      <div className="status-overview-pattern" aria-hidden="true" />
      <div className="status-overview-body relative z-10 flex flex-wrap items-center justify-between gap-6 p-6 sm:p-7">
        <div className="flex items-center gap-4 sm:gap-6"><div className="status-orbit shrink-0" aria-hidden="true"><span className="status-orbit-ring" /><span className="status-orbit-ring second" /><span className="status-orbit-core">{snapshot.status === 'operational' ? <Check size={26} /> : snapshot.status === 'maintenance' ? <Wrench size={23} /> : <Radio size={23} />}</span></div><div><p className="status-live font-mono text-[9px] uppercase tracking-[.18em]">{snapshot.available ? 'Live network overview' : 'Connection to feed unavailable'}</p><h2 className="mt-2 text-[clamp(20px,3vw,30px)] font-semibold leading-tight tracking-[-.035em] text-white">{snapshot.label}</h2><p className="mt-2 max-w-lg text-xs leading-relaxed text-zinc-500">{snapshot.available ? 'Current availability reported by Better Stack.' : 'Current availability cannot be confirmed. Automatic sync will retry.'}</p></div></div>
        <span className="status-auto"><span className={`status-dot ${refreshing ? 'motion-safe:animate-pulse' : ''}`} />{refreshing ? 'Syncing' : 'Auto sync · 5 min'}</span>
      </div>
      <div className="status-metrics relative z-10 grid grid-cols-3 divide-x divide-white/10">
        {[{ value: snapshot.available ? `${operational}/${snapshot.resources.length}` : '—', label: 'Operational services', Icon: Layers3 }, { value: snapshot.available ? active.length : '—', label: 'Active incidents', Icon: ShieldCheck }, { value: snapshot.available ? maintenance.length : '—', label: 'Planned / active work', Icon: Wrench }].map(stat => <div key={stat.label} className="status-metric"><stat.Icon size={15} className="hidden text-zinc-600 sm:block" /><div><p className="text-[clamp(24px,3vw,32px)] font-semibold leading-none tracking-tight text-zinc-100">{stat.value}</p><p className="mt-2 font-mono text-[8px] uppercase leading-relaxed tracking-[.11em] text-zinc-500 sm:text-[9px]">{stat.label}</p></div></div>)}
      </div>
      <div className="status-overview-meta relative z-10 flex flex-wrap items-center justify-between gap-3 px-6 py-3 font-mono text-[9px] text-zinc-500 sm:px-8"><span className="flex items-center gap-2"><Clock3 size={11} />{snapshot.available ? 'Source updated' : 'Last sync attempt'} {timestamp(snapshot.checkedAt)}</span><span className="flex items-center gap-2"><span className="status-auto-indicator" />Updates in place</span></div>
    </section></Reveal>
    <div aria-live="polite" className="sr-only">{refreshing ? 'Updating status' : snapshot.label}</div>
    <nav aria-label="Status page sections" className="status-section-nav mt-7"><a href="#monitors">Service health</a><a href="#maintenance">Maintenance</a><a href="#history">Event history</a><span className="ml-auto hidden items-center gap-2 font-mono text-[9px] text-zinc-600 sm:flex"><ShieldCheck size={12} />Public monitoring</span></nav>
    {snapshot.announcement && <aside className="status-announcement mt-6"><Radio size={17} className="shrink-0" /><p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{snapshot.announcement}</p></aside>}
    {active.length > 0 && <section className="mt-7" aria-labelledby="active-incidents"><h2 id="active-incidents" className="status-section-heading mb-4">Current incidents</h2><div className="space-y-3">{active.map(report => <ReportCard key={report.id} report={report} />)}</div></section>}
    <AvailabilityChart resources={snapshot.resources} checkedAt={snapshot.checkedAt} />
    <div className="status-content-grid mt-7">
      <section id="monitors" aria-labelledby="monitors-title" className="min-w-0 scroll-mt-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><p className="status-kicker">01 / Availability</p><h2 id="monitors-title" className="status-section-heading mt-2">Service health</h2></div><div className="status-period" role="group" aria-label="History period">{([30, 90] as const).map(period => <button key={period} aria-pressed={days === period} onClick={() => setDays(period)}>{period} days</button>)}</div></div>
        <div className="status-monitors-grid">{monitors.map((resource, index) => <Reveal key={resource.id} className={resource.section === 'Core' ? 'status-monitor-featured' : ''} delay={Math.min(index * .035, .14)}><ResourceCard resource={resource} days={days} checkedAt={snapshot.checkedAt} /></Reveal>)}</div>
        {monitors.length === 0 && <div className="status-empty"><Activity size={23} /><p>{snapshot.available ? 'No automated services have been published yet.' : 'Service telemetry is temporarily unavailable.'}</p></div>}
        <div className="status-history-legend mt-5">{(['operational', 'degraded', 'down', 'maintenance', 'unknown'] as const).map(status => <span key={status} className={`status-tone-${status}`}><span className="status-dot" />{status === 'unknown' ? 'No monitoring data' : labels[status]}</span>)}</div>
        <p className="mt-3 text-[10px] leading-relaxed text-zinc-600">Explore a bar with your pointer, touch, or arrow keys. Daily history uses UTC dates. Gaps are not counted as confirmed uptime.</p>
      </section>
      <aside className="status-sidebar">
        <Reveal><section className="status-watch-panel" aria-labelledby="incident-watch"><div className="status-watch-heading"><span className="status-panel-icon"><ShieldCheck size={16} /></span><h2 id="incident-watch">Incident watch</h2><span className="status-count">{snapshot.available ? active.length : '—'}</span></div>{active.length ? <div className="status-sidebar-events">{active.slice(0, 3).map(report => <a key={report.id} href="#active-incidents"><span>{report.title}</span><small>{timestamp(report.startsAt)}</small></a>)}</div> : <div className="status-watch-empty"><span className={`status-watch-symbol status-tone-${snapshot.available ? 'operational' : 'unknown'}`}><CircleCheck size={24} /></span><h3>{snapshot.available ? 'No active public incidents' : 'Incident feed unavailable'}</h3><p>{snapshot.available ? 'Published disruptions and progress updates appear here when something needs attention.' : 'Use the independent status page while the feed reconnects.'}</p></div>}<a href="#history" className="status-panel-link">View event history <ArrowUpRight size={12} /></a></section></Reveal>
        <Reveal delay={.06}><section className="status-watch-panel" aria-labelledby="next-maintenance"><div className="status-watch-heading"><span className="status-panel-icon"><Wrench size={16} /></span><h2 id="next-maintenance">Maintenance</h2><span className="status-count">{snapshot.available ? maintenance.length : '—'}</span></div>{maintenance.length ? <div className="status-sidebar-events">{maintenance.slice(0, 3).map(report => <a key={report.id} href="#maintenance"><span>{report.title}</span><small>{timestamp(report.startsAt)}</small></a>)}</div> : <div className="status-watch-empty"><span className="status-watch-symbol status-tone-maintenance"><Clock3 size={23} /></span><h3>{snapshot.available ? 'Nothing scheduled' : 'Schedule unavailable'}</h3><p>{snapshot.available ? 'Planned windows are published here before work begins.' : 'Schedule information will return when the feed reconnects.'}</p></div>}<a href="#maintenance" className="status-panel-link">View planned work <ArrowUpRight size={12} /></a></section></Reveal>
        {dependencies.length > 0 && <Reveal delay={.1}><section className="status-dependencies" aria-labelledby="dependency-title"><p className="status-kicker">External / manually reported</p><h2 id="dependency-title" className="mt-2 text-sm font-semibold text-zinc-300">Dependencies</h2>{dependencies.map(resource => <div key={resource.id} className="status-dependency-row"><span>{resource.name}</span><StatusLabel status={resource.status} /></div>)}<p className="mt-3 text-[10px] leading-relaxed text-zinc-600">Manually maintained states. Automated uptime measurements are not available for these entries.</p></section></Reveal>}
      </aside>
    </div>
    <Reveal><section id="maintenance" aria-labelledby="maintenance-title" className="status-event-section mt-12 scroll-mt-8"><div className="status-event-header"><div><p className="status-kicker">02 / Planned operations</p><h2 id="maintenance-title" className="status-section-heading mt-2">Maintenance windows</h2></div><span className="status-event-mark"><Wrench size={20} /></span></div><div className="space-y-3">{maintenance.map(report => <ReportCard key={report.id} report={report} />)}</div>{maintenance.length === 0 && <div className="status-large-empty"><span className="status-empty-emblem"><Wrench size={24} /></span><div><h3>{snapshot.available ? 'No planned maintenance published' : 'Maintenance information unavailable'}</h3><p>{snapshot.available ? 'Upcoming windows, affected services, and progress updates will appear here.' : 'Check the independent status page for current updates.'}</p></div><span className="status-empty-caption">PLANNED WORK</span></div>}</section></Reveal>
    <Reveal><section id="history" aria-labelledby="history-title" className="status-event-section mt-9 scroll-mt-8"><div className="status-event-header"><div><p className="status-kicker">03 / A transparent record</p><h2 id="history-title" className="status-section-heading mt-2">Event history</h2></div><div className="status-period" role="group" aria-label="Report filter">{(['all', 'incident', 'maintenance'] as const).map(value => <button key={value} onClick={() => setFilter(value)} aria-pressed={filter === value}>{value === 'all' ? 'All events' : value === 'incident' ? 'Incidents' : 'Maintenance'}</button>)}</div></div><div className="status-event-timeline space-y-3">{history.map(report => <ReportCard key={report.id} report={report} />)}</div>{history.length === 0 && <div className="status-large-empty"><span className="status-empty-emblem"><Clock3 size={24} /></span><div><h3>{snapshot.available ? 'No matching public events yet' : 'Status history unavailable'}</h3><p>{snapshot.available ? 'Published incident and maintenance reports will form the timeline here.' : 'History will return when the public feed reconnects.'}</p></div><span className="status-empty-caption">PUBLIC RECORD</span></div>}</section></Reveal>
    <div className="status-bottom mt-8"><p><Radio size={14} />Monitoring by <strong>Better Stack</strong></p><a href="https://status.avrxt.dev" target="_blank" rel="noreferrer">Independent status page <ArrowUpRight size={13} /></a></div>
    <p className="mt-4 text-[10px] leading-relaxed text-zinc-600">Uptime reflects the provider’s monitored endpoint and measurement period, not a service-level guarantee. Only public reports appear here; internal alerts and investigation notes remain private. Update timestamps are shown in IST.</p>
  </div>;
}
