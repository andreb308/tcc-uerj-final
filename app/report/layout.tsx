'use client';

import { PrinterIcon, TerminalIcon, XIcon } from '@phosphor-icons/react';
import Link from 'next/link';
import { SignInButton, Show, UserButton } from '@clerk/nextjs';

export default function ReportLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="font-mono text-ink antialiased min-h-screen flex flex-col selection:bg-[#FFFF00] selection:text-ink bg-paper">
      <header className="flex items-center justify-between border-b border-ink bg-paper px-6 py-3 print:hidden sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-4 cursor-pointer">
          <div className="size-6 flex items-center justify-center bg-ink text-paper">
            <TerminalIcon className="h-4 w-4" aria-hidden="true" />
          </div>
          <h2 className="font-display font-bold text-lg tracking-tight uppercase">
            THE_ARCHIVE [v.1.0]
          </h2>
        </Link>
        <div className="flex items-center gap-4">
          <button
            className="group flex h-8 items-center gap-2 border border-ink bg-paper px-4 text-xs font-bold uppercase tracking-wider hover:bg-ink hover:text-paper transition-colors duration-0"
            onClick={() => window.print()}
          >
            <PrinterIcon className="h-4 w-4" aria-hidden="true" />
            <span>Print Manifesto</span>
          </button>
          <Link
            href="/deconstruction"
            className="size-8 flex items-center justify-center border border-ink bg-paper hover:bg-alert hover:text-white transition-colors duration-0"
          >
            <XIcon className="h-4 w-4" aria-hidden="true" />
          </Link>

          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="cursor-pointer h-8 border border-ink bg-paper px-3 text-xs font-bold uppercase tracking-wider hover:bg-ink hover:text-paper transition-colors duration-0">
                [ SIGN_IN ]
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </header>
      {children}
    </div>
  );
}
