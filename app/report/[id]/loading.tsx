'use client';

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-400 rounded-md ${className}`} />;
}

export default function Loading() {
  return (
    <main className="grow flex flex-col w-full max-w-[1400px] mx-auto p-0 md:p-8 lg:p-12">
      <div className="flex flex-col border border-ink bg-background shadow-panel print:shadow-none print:border-2">
        {/* Header Skeleton */}
        <div className="border-b border-ink p-8 md:p-12 relative overflow-hidden">
          <div className="flex flex-col gap-6 relative z-10">
            <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-ink/30 pb-4">
              <Skeleton className="h-4 w-48" />
              <div className="flex items-center gap-2">
                <div className="size-2 bg-ink/20 rounded-full animate-pulse"></div>
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-16 w-64 md:h-24 md:w-96" />
                <Skeleton className="h-16 w-48 md:h-24 md:w-72" />
              </div>
              <Skeleton className="h-16 w-64 md:h-16 md:w-64" />
            </div>
            <div className="flex flex-wrap gap-y-2 gap-x-8 pt-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>

        {/* Content Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-ink">
          {/* Section 01 */}
          <div className="lg:col-span-5 p-8 flex flex-col gap-6">
            <h3 className="font-display text-2xl font-bold uppercase border-b border-ink pb-2">
              01 // Thesis Statement
            </h3>
            <div className="flex flex-col gap-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="mt-auto pt-8">
              <div className="border border-ink p-4 bg-paper-dim">
                <Skeleton className="h-3 w-32 mb-2" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4 mt-2" />
              </div>
            </div>
          </div>

          {/* Section 02 */}
          <div className="lg:col-span-3 bg-paper-dim/30 flex flex-col">
            <div className="p-4 border-b border-ink">
              <h3 className="font-display text-lg font-bold uppercase">02 // Data</h3>
            </div>
            <div className="flex flex-col divide-y divide-ink/20">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 flex justify-between items-center">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-ink mt-auto">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-3 w-24 mx-auto mt-2" />
            </div>
          </div>

          {/* Section 03 */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="p-4 border-b border-ink">
              <h3 className="font-display text-lg font-bold uppercase">03 // Idiom Decoder</h3>
            </div>
            <div className="grow p-4 flex flex-col gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-4 w-1/3 shrink-0" />
                  <div className="flex flex-col gap-2 w-full">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Skeleton */}
        <div className="border-t border-ink bg-paper p-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <Skeleton className="h-4 w-48" />
          <div className="h-px w-full md:w-32 bg-ink/20"></div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
      </div>
    </main>
  );
}
