'use client';

import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
import type { ReportRecord } from '@/lib/schemas/report';
import { getAllReportsAction } from '@/app/actions/report';

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
  const pathname = usePathname();
  const [limit, setLimit] = useState(8);

  const { data: reports = [], isPlaceholderData } = useQuery<ReportRecord[]>({
    queryKey: ['reports', limit],
    queryFn: async () => {
      return await getAllReportsAction(limit + 1);
    },
    placeholderData: keepPreviousData,
  });

  const hasMore = reports.length > limit;

  // If we are currently transitioning to a larger limit, reports holds the previous key's data.
  // We lock displayLimit to reports.length - 1 so the "+1" lookahead item does not pop in prematurely.
  const displayLimit = isPlaceholderData && reports.length > 0
    ? reports.length - 1
    : limit;

  const visibleReports = reports.slice(0, displayLimit);

  useEffect(() => {
    const start = Date.now() - (142 * 3600 + 4 * 60 + 11) * 1000;

    const interval = setInterval(() => {
      setUptime(formatUptime(start));
    }, 1000);

    return () => clearInterval(interval);
  }, []);



  return (
    <Sidebar collapsible="none" className="h-full border-r border-border">
      {/* Navigation */}
      <SidebarContent className="">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="rounded-none border-b border-border bg-primary px-4 py-3 text-[10px] uppercase tracking-wider text-primary-foreground">
            SYSTEM_MODULES
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="gap-0">
              {/* Dynamic Reports from Store */}
              {visibleReports.length ? (
                <>
                  {visibleReports.map((report) => (
                    <SidebarMenuItem key={report.id}>
                      <SidebarMenuButton
                        render={
                          <Link href={`/report/${report.id}`}>
                            {report.albumCover?.small ? (
                              <img
                                src={report.albumCover.small}
                                alt={`${report.trackTitle} cover`}
                                className="size-10 object-cover shrink-0 border border-current"
                              />
                            ) : (
                              <div className="size-10 shrink-0 border border-current bg-background flex items-center justify-center text-[10px]">
                                💿
                              </div>
                            )}
                            <div className="flex flex-col min-w-0 items-start text-left gap-0.5">
                              <span className="truncate font-bold">{report.trackTitle}</span>
                              <span className="truncate text-[10px] font-normal text-muted-foreground group-data-[active=true]/menu-button:text-background/70 group-hover/menu-button:text-background/70">
                                {report.artist}
                              </span>
                            </div>
                          </Link>
                        }
                        isActive={pathname === `/report/${report.id}`}
                        className="rounded-none border-b border-border bg-muted px-4 py-6 text-xs font-bold uppercase tracking-wider data-[active=true]:bg-foreground data-[active=true]:text-background text-foreground hover:bg-foreground hover:text-background cursor-pointer"
                      ></SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  {hasMore && (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => setLimit((prev) => prev + 8)}
                        className="rounded-none border-b border-border bg-background hover:bg-foreground hover:text-background cursor-pointer px-4 py-3 text-[10px] font-mono tracking-widest uppercase text-muted-foreground text-center flex items-center justify-center gap-1.5"
                      >
                        <span>+ LOAD MORE</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </>
              ) : (
                NAV_ITEMS.map((item, i) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      isActive={i === 0}
                      className="rounded-none border-b border-border bg-muted px-4 py-6 text-xs font-bold uppercase tracking-wider data-[active=true]:bg-foreground data-[active=true]:text-background text-foreground hover:bg-foreground hover:text-background cursor-pointer"
                    >
                      [ {item.label} ]
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      {/* <SidebarFooter className="border-t border-border px-4 py-3">
        <div className="flex flex-col gap-0.5 font-mono text-[10px] uppercase text-muted-foreground">
          <span>LOADED: CORE_MODULES.DLL</span>
          <span>STATUS: ACTIVE_LISTENING</span>
          <span>UPTIME: {uptime}</span>
        </div>
      </SidebarFooter> */}
    </Sidebar>
  );
}
