'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const [countdown, setCountdown] = useState<number>(10);

  useEffect(() => {
    if (countdown <= 0) {
      router.replace('/');
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, router]);

  return (
    <main className="grow flex flex-col items-center justify-center font-mono text-ink bg-paper p-6 relative">
      <div className="border border-destructive max-w-[500px] w-full p-8 bg-paper-dim drop-shadow-[4px_4px_0px_#1c100d] text-center motion-preset-bounce">
        <h2 className="text-destructive font-display font-black text-xl uppercase tracking-wider mb-4 animate-pulse">
          [/// ACCESS_DENIED ///]
        </h2>
        <p className="text-xs uppercase tracking-wide text-ink/85 mb-6 leading-relaxed">
          {error.message || 'Error while accessing deconstruction record.'}
        </p>
        <div className="bg-destructive text-white py-2 px-4 inline-block font-bold text-xs uppercase tracking-widest rounded-sm">
          Redirecting to Portal in {countdown}s
        </div>
      </div>
    </main>
  );
}
