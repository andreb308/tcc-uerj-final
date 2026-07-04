'use client';

import { ArrowLeftIcon } from '@phosphor-icons/react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grow flex flex-col items-center justify-center w-full max-w-[1400px] mx-auto p-8">
      <div className="text-center font-mono">
        <h2 className="text-2xl font-bold uppercase mb-4 text-alert">Error Loading Report</h2>
        <p className="text-muted-foreground mb-6">
          {error?.message || 'Report data is incomplete or missing.'}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* <button
            onClick={() => reset()}
            className="cursor-pointer border border-ink bg-paper px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-ink hover:text-paper transition-colors duration-200"
          >
            Retry Protocol
          </button> */}
          <Link
            href="/"
            className="cursor-pointer inline-flex items-center gap-2 border border-ink bg-paper px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-ink hover:text-paper"
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            Return to Homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
