'use client';

import { useEffect, useState } from 'react';
import { FloppyDisk } from '@phosphor-icons/react';

function formatUtc(date: Date) {
  return date.toISOString().replace('T', ' ').slice(0, 19);
}

export function Header() {
  const [utcString, setUtcString] = useState(() => formatUtc(new Date()));

  useEffect(() => {
    const interval = setInterval(() => {
      setUtcString(formatUtc(new Date()));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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
