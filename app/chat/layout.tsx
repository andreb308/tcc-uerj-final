'use client';

import { TerminalIcon } from '@phosphor-icons/react';
import Link from 'next/link';
import { useUtcTime } from '@/hooks/use-utc-time';

export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const utcString = useUtcTime();

  return (
    <div className="font-mono text-ink antialiased h-screen flex flex-col selection:bg-[#FFFF00] selection:text-ink bg-paper">
      <header className="flex items-center justify-between border-b border-ink bg-paper px-6 py-3 print:hidden shrink-0 z-50">
        <Link href="/" className="flex items-center gap-4 cursor-pointer">
          <div className="size-6 flex items-center justify-center bg-ink text-paper rounded-sm">
            <TerminalIcon className="h-4 w-4" aria-hidden="true" />
          </div>
          <h2 className="font-display font-bold text-lg tracking-tight uppercase">
            THE_ARCHIVE [v.1.0]
          </h2>
        </Link>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Session Active
          </span>
          <div className="bg-ink text-paper px-3 py-1 rounded-sm">
            <span className="font-mono text-xs font-semibold" suppressHydrationWarning>
              {utcString} UTC
            </span>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
