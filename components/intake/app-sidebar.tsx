'use client';

import { useEffect, useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const NAV_ITEMS = [
  { label: 'INTAKE_PROTOCOL', href: '/' },
  { label: 'SESSION_HISTORY', href: '/session-history' },
  { label: 'SYSTEM_DIAGS', href: '/system-diags' },
  { label: 'LINGUISTIC_INDEX', href: '/linguistic-index' },
  { label: 'USER_PROFILE', href: '/user-profile' },
  { label: 'SECURITY_OVERSIGHT', href: '/security-oversight' },
] as const;

function formatUptime(start: number) {
  const diff = Math.floor((Date.now() - start) / 1000);
  const h = String(Math.floor(diff / 3600)).padStart(3, '0');
  const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
  const s = String(diff % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function AppSidebar() {
  const [uptime, setUptime] = useState('142:04:11');

  useEffect(() => {
    const start = Date.now() - (142 * 3600 + 4 * 60 + 11) * 1000;

    const interval = setInterval(() => {
      setUptime(formatUptime(start));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Sidebar collapsible="none" className="h-dvh border-r border-border">
      {/* Navigation */}
      <SidebarContent className="">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="rounded-none border-b border-border bg-primary px-4 py-3 text-[10px] uppercase tracking-wider text-primary-foreground">
            SYSTEM_MODULES
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="gap-0">
              {NAV_ITEMS.map((item, i) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    isActive={i === 0}
                    className="rounded-none border-b border-border bg-muted px-4 py-6 text-xs font-bold uppercase tracking-wider data-[active=true]:bg-foreground data-[active=true]:text-background ext-foreground hover:bg-foreground hover:text-background cursor-pointer"
                  >
                    [ {item.label} ]
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-border px-4 py-3">
        <div className="flex flex-col gap-0.5 font-mono text-[10px] uppercase text-muted-foreground">
          <span>LOADED: CORE_MODULES.DLL</span>
          <span>STATUS: ACTIVE_LISTENING</span>
          <span>UPTIME: {uptime}</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
