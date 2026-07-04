'use client';

import { FloppyDiskIcon } from '@phosphor-icons/react';
import { useUtcTime } from '@/hooks/use-utc-time';
import { SignInButton, SignUpButton, Show, UserButton } from '@clerk/nextjs';

export function Header() {
  const utcString = useUtcTime();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-2">
        <FloppyDiskIcon className="size-4 text-foreground" weight="bold" />
        <h1 className="font-display text-lg font-bold uppercase tracking-tight text-foreground">
          THE_ARCHIVE [v.1.0]
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm tracking-wider text-foreground" suppressHydrationWarning>
          UTC {utcString}
        </span>

        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="cursor-pointer border border-border bg-card px-3 py-2 hover:bg-accent text-foreground hover:text-accent-foreground text-sm font-mono uppercase tracking-wider transition-all duration-200">
              [ SIGN_IN ]
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="cursor-pointer bg-foreground px-3 py-2 hover:bg-foreground/80 text-background text-sm font-mono uppercase tracking-wider transition-all duration-200">
              [ SIGN_UP ]
            </button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </header>
  );
}
