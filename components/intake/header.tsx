'use client';

import { FloppyDisk } from '@phosphor-icons/react';
import { useUtcTime } from '@/hooks/use-utc-time';

export function Header() {
  const utcString = useUtcTime();


  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-2">
        <FloppyDisk className="size-4 text-foreground" weight="bold" />
        <h1 className="font-display text-lg font-bold uppercase tracking-tight text-foreground">
          THE_ARCHIVE [v.1.0]
        </h1>
      </div>

      <span className="text-sm tracking-wider text-foreground" suppressHydrationWarning>
        UTC {utcString}
      </span>
    </header>
  );
}
