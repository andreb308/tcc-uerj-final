function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-400/40 ${className}`} />;
}

export function LoadingState() {
  return (
    <div className="flex grow overflow-hidden">
      {/* Left Pane Skeleton */}
      <div className="w-[40%] border-r border-ink flex flex-col shrink-0">
        <div className="bg-paper-dim border-b border-ink">
          <div className="flex">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-1 border-r border-ink last:border-r-0 px-3 py-3">
                <Skeleton className="h-3 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
        <div className="grow p-4 flex flex-col gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 pl-2">
              <Skeleton className="h-3 w-5 shrink-0 mt-1" />
              <Skeleton className="h-5 w-full" />
            </div>
          ))}
        </div>
      </div>
      {/* Right Pane Skeleton */}
      <div className="flex-1 flex flex-col p-8 gap-8">
        <Skeleton className="h-4 w-64 mx-auto" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="mt-auto">
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
    </div>
  );
}
