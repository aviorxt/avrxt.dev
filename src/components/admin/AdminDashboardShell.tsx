'use client';

import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Activity, BookOpen, Camera, ChevronUp, Eye, FolderLock, House, LayoutDashboard, Link2, LogOut, Mail, MessageSquareQuote, Music, NotebookPen, Palette, PanelLeft, ScrollText, Settings, SlidersHorizontal, User, type LucideIcon } from 'lucide-react';
import { logout } from '@/app/actions/auth';
import type { DashboardViewer } from '@/lib/dashboard-viewer';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';

const navigation: ReadonlyArray<{ label: string; suffix: string; href?: string; section?: ProfileSection; icon: LucideIcon }> = [
  { label: 'Profile editor', suffix: '', icon: LayoutDashboard },
  { label: 'Personal storage', suffix: '/storage', icon: FolderLock },
  { label: 'Notes', suffix: '', href: '/notes', icon: NotebookPen },
  { label: 'Guestbook', suffix: '', section: 'guestbook', icon: MessageSquareQuote },
  { label: 'Short links', suffix: '/short-links', icon: Link2 },
  { label: 'Logs', suffix: '/logs', icon: ScrollText },
  { label: 'Mail broadcast', suffix: '/mail-broadcat', icon: Mail },
];

export const profileSections = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'themes', label: 'Themes', icon: Palette },
  { id: 'presence', label: 'Presence', icon: Activity },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'widgets', label: 'Widgets', icon: SlidersHorizontal },
  { id: 'links', label: 'Links', icon: Link2 },
  { id: 'resources', label: 'Resources', icon: BookOpen },
  { id: 'gallery', label: 'Visual feed', icon: Camera },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

export type ProfileSection = (typeof profileSections)[number]['id'] | 'guestbook';

const ProfileSectionContext = createContext<{ activeSection: ProfileSection; setActiveSection: (section: ProfileSection) => void } | null>(null);

export function useAdminProfileSection() {
  const context = useContext(ProfileSectionContext);
  if (!context) throw new Error('useAdminProfileSection must be used within AdminDashboardShell.');
  return context;
}

export default function AdminDashboardShell({ dashboardPath, viewer, children, showToolbar = true }: { dashboardPath: string; viewer: DashboardViewer; children: ReactNode; showToolbar?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedSection = searchParams.get('section');
  const [activeSection, setActiveSection] = useState<ProfileSection>(requestedSection === 'guestbook' ? 'guestbook' : 'profile');
  const isProfileEditor = pathname === dashboardPath;
  useEffect(() => {
    if (requestedSection === 'guestbook') setActiveSection('guestbook');
  }, [requestedSection]);
  return (
    <ProfileSectionContext.Provider value={{ activeSection, setActiveSection }}>
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border p-3">
          <Link href={dashboardPath} className="flex items-center gap-3 rounded-md px-2 py-2 text-sidebar-foreground hover:bg-sidebar-accent">
            <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-md border border-sidebar-border bg-black/30 p-1"><img src="https://cdn.avrxt.dev/logo/avrxt-vector-slash-Photoroom.png" alt="AVRXT" className="h-full w-full object-contain" /></span>
            <span className="min-w-0 group-data-[collapsible=icon]:hidden"><strong className="block truncate text-xs tracking-wide">AVRXT</strong><small className="block truncate font-mono text-[9px] text-sidebar-foreground/60">ADMIN CONSOLE</small></span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="overflow-hidden">
          <ScrollArea className="h-full">
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map(({ label, suffix, href: directHref, section, icon: Icon }) => {
                  const href = directHref || (section ? `${dashboardPath}?section=${section}` : `${dashboardPath}${suffix}`);
                  const active = section ? pathname === dashboardPath && activeSection === section : pathname === href;
                  return <SidebarMenuItem key={href}><SidebarMenuButton render={<Link href={href} />} isActive={active} tooltip={label}><Icon /><span>{label}</span></SidebarMenuButton></SidebarMenuItem>;
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          {isProfileEditor && <SidebarGroup>
            <SidebarGroupLabel>Profile</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {profileSections.map(({ id, label, icon: Icon }) => <SidebarMenuItem key={id}>
                  <SidebarMenuButton type="button" isActive={activeSection === id} onClick={() => setActiveSection(id)} tooltip={label}><Icon /><span>{label}</span></SidebarMenuButton>
                </SidebarMenuItem>)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>}
          </ScrollArea>
        </SidebarContent>
        <SidebarFooter className="relative border-t border-sidebar-border p-3 group-data-[collapsible=icon]:hidden">
          <details className="group/account">
            <summary className="flex cursor-pointer list-none items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-sidebar-accent [&::-webkit-details-marker]:hidden">
              {viewer.avatarUrl ? <img src={viewer.avatarUrl} alt="" className="size-8 rounded-full border border-sidebar-border object-cover" /> : <span className="grid size-8 place-items-center rounded-full bg-sidebar-primary text-[11px] font-bold text-sidebar-primary-foreground">{viewer.displayName.slice(0, 1).toUpperCase()}</span>}
              <span className="min-w-0 flex-1"><strong className="block truncate text-xs text-sidebar-foreground">{viewer.displayName}</strong><small className="block truncate font-mono text-[9px] text-sidebar-foreground/60">Logged in as @{viewer.username}</small></span>
              <ChevronUp size={14} className="shrink-0 transition-transform group-open/account:rotate-180" />
            </summary>
            <div className="absolute bottom-[calc(100%+0.5rem)] left-2 right-2 z-30 overflow-hidden rounded-lg border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-2xl shadow-black/50">
              <div className="flex items-center gap-3 border-b border-sidebar-border px-3 py-3">
                {viewer.avatarUrl ? <img src={viewer.avatarUrl} alt="" className="size-8 rounded-full border border-sidebar-border object-cover" /> : <span className="grid size-8 place-items-center rounded-full bg-sidebar-primary text-[11px] font-bold text-sidebar-primary-foreground">{viewer.displayName.slice(0, 1).toUpperCase()}</span>}
                <span className="min-w-0"><strong className="block truncate text-sm">{viewer.displayName}</strong><small className="block truncate text-xs text-sidebar-foreground/60">@{viewer.username} · Discord</small></span>
              </div>
              <div className="p-1">
                <Link href="/" className="flex min-h-9 items-center gap-2 rounded-md px-2.5 text-sm hover:bg-sidebar-accent"><House size={15} /> AVRXT home</Link>
                <Link href="/me" target="_blank" prefetch={false} className="flex min-h-9 items-center gap-2 rounded-md px-2.5 text-sm hover:bg-sidebar-accent"><Eye size={15} /> Preview profile</Link>
              </div>
              <div className="border-t border-sidebar-border p-1"><button type="button" onClick={() => logout('/me')} className="flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent"><LogOut size={15} /> Log out</button></div>
            </div>
          </details>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="min-w-0 bg-[#050505] text-zinc-100">
        {showToolbar && <div className="flex min-h-12 items-center gap-3 border-b border-white/10 px-4 md:px-6">
          <SidebarTrigger aria-label="Toggle dashboard sidebar" className="text-zinc-300 hover:bg-white/10 hover:text-white" />
          <div className="hidden items-center gap-2 text-[10px] text-zinc-500 sm:flex"><PanelLeft size={13} /><span>Toggle navigation</span><KbdGroup><Kbd>Ctrl</Kbd><Kbd>B</Kbd></KbdGroup></div>
        </div>}
        {children}
      </SidebarInset>
    </SidebarProvider>
    </ProfileSectionContext.Provider>
  );
}
