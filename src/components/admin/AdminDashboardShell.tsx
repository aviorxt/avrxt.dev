'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Database, FolderLock, LayoutDashboard, Mail, PanelLeft, ShieldCheck } from 'lucide-react';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
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

const navigation = [
  { label: 'Profile editor', suffix: '', icon: LayoutDashboard },
  { label: 'Personal storage', suffix: '/storage', icon: FolderLock },
  { label: 'Mail broadcast', suffix: '/mail-broadcat', icon: Mail },
] as const;

export default function AdminDashboardShell({ dashboardPath, children }: { dashboardPath: string; children: ReactNode }) {
  const pathname = usePathname();
  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border p-3">
          <Link href={dashboardPath} className="flex items-center gap-3 rounded-md px-2 py-2 text-sidebar-foreground hover:bg-sidebar-accent">
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground"><ShieldCheck size={15} /></span>
            <span className="min-w-0 group-data-[collapsible=icon]:hidden"><strong className="block truncate text-xs tracking-wide">AVRXT</strong><small className="block truncate font-mono text-[9px] text-sidebar-foreground/60">ADMIN CONSOLE</small></span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map(({ label, suffix, icon: Icon }) => {
                  const href = `${dashboardPath}${suffix}`;
                  return <SidebarMenuItem key={href}><SidebarMenuButton render={<Link href={href} />} isActive={pathname === href} tooltip={label}><Icon /><span>{label}</span></SidebarMenuButton></SidebarMenuItem>;
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-3 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2 rounded-md bg-sidebar-accent/60 px-2 py-2 text-[10px] text-sidebar-foreground/70"><Database size={13} /><span>Authenticated session</span></div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="min-w-0 bg-[#050505] text-zinc-100">
        <div className="flex min-h-12 items-center gap-3 border-b border-white/10 px-4 md:px-6">
          <SidebarTrigger aria-label="Toggle dashboard sidebar" className="text-zinc-300 hover:bg-white/10 hover:text-white" />
          <div className="hidden items-center gap-2 text-[10px] text-zinc-500 sm:flex"><PanelLeft size={13} /><span>Toggle navigation</span><KbdGroup><Kbd>Ctrl</Kbd><Kbd>B</Kbd></KbdGroup></div>
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
