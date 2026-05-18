import Link from 'next/link';
import { ArrowLeftIcon } from '@phosphor-icons/react';

export function ErrorState({ message }: { message?: string }) {
  return (
    <div className="grow flex flex-col items-center justify-center p-8">
      <div className="text-center font-mono">
        <h2 className="text-2xl font-bold uppercase mb-4 text-alert">Session Error</h2>
        <p className="text-muted-foreground">
          {message || 'Report data is incomplete or missing.'}
        </p>
        <Link
          href="/index"
          className="mt-8 inline-flex items-center gap-2 hover:underline hover:text-alert transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          RETURN TO INDEX
        </Link>
      </div>
    </div>
  );
}
