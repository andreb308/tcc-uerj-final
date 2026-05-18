import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ReportRecord } from '@/lib/schemas/report';

export function padLineNumber(n: number): string {
  return String(n).padStart(2, '0');
}

interface EvidencePaneProps {
  report: ReportRecord;
  activeLine: number | null;
  onLineClick: (lineIndex: number, lineText: string) => void;
}

export function EvidencePane({ report, activeLine, onLineClick }: EvidencePaneProps) {
  const lines = report.artifactData.split('\n').filter((line) => line.trim() !== '');

  const album = report.reportData?.metadata?.album ?? '—';
  const year = report.reportData?.metadata?.year ?? '—';

  return (
    <div className="w-[35%] border-r border-ink flex flex-col shrink-0 bg-paper-dim">
      {/* Metadata Header Table */}
      <div className="bg-black/5 border-b border-ink shrink-0">
        <div className="flex divide-x divide-ink">
          <div className="flex-1 px-3 py-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block">
              Artist_Name
            </span>
            <span className="font-mono text-xs font-semibold uppercase block mt-0.5 truncate">
              {report.artist}
            </span>
          </div>
          <div className="flex-1 px-3 py-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block">
              Track_Title
            </span>
            <span className="font-mono text-xs font-semibold uppercase block mt-0.5 truncate">
              {report.trackTitle}
            </span>
          </div>
          <div className="flex-1 px-3 py-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block">
              Album
            </span>
            <span className="font-mono text-xs font-semibold uppercase block mt-0.5 truncate">
              {album} ({year})
            </span>
          </div>
        </div>
      </div>

      {/* Lyric Viewer */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="pl-4 pr-8 pt-8 pb-32 flex flex-col gap-6">
          <TooltipProvider>
            {lines.map((line, index) => {
              const isActive = activeLine === index;
              const match = line.match(/^\[(\d+)\]\s*(.*)$/);
              const count = match
                ? padLineNumber(parseInt(match[1], 10))
                : padLineNumber(index + 1);
              const text = match ? match[2].trim() : line.trim();

              return (
                <Tooltip key={index}>
                  <TooltipTrigger
                    onClick={() => onLineClick(index, line)}
                    className={`group relative flex flex-col items-start pl-[40px] pr-[16px] py-[8px] text-left rounded-[2px] cursor-pointer transition-colors duration-75 w-full ${
                      isActive
                        ? 'bg-alert/20 shadow-[0px_0px_0px_1px_rgba(242,59,13,0.2)]'
                        : 'hover:bg-black/5'
                    }`}
                  >
                    {/* Lyric Text */}
                    <span className="font-display text-[18px] font-medium leading-[29.25px] text-ink w-full">
                      {text}
                    </span>

                    {/* Inline absolute line number */}
                    <span className="absolute font-mono text-[10px] left-[8px] text-black/40 top-[12px] leading-[15px] select-none">
                      {count}
                    </span>

                    {/* Active Indicator Arrow */}
                    {isActive && (
                      <span className="absolute right-[16px] top-1/2 -translate-y-1/2 text-alert text-sm">
                        ←
                      </span>
                    )}
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Send to Chat</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>
      </ScrollArea>

      {/* Sticky Footer */}
      <div className="border-t border-ink bg-paper-dim px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="size-2 bg-alert rounded-full animate-pulse" />
          <span className="font-mono text-[10px] font-semibold tracking-widest uppercase">
            Live Artifact
          </span>
        </div>
        <span className="font-mono text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
          Lines: {lines.length}
        </span>
      </div>
    </div>
  );
}
