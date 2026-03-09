import { cn } from '@/lib/utils';

interface TerminalCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function TerminalCard({ title, children, className }: TerminalCardProps) {
  return (
    <div
      className={cn(
        'flex max-h-full w-full max-w-[600px] flex-col border border-border bg-background shadow-[8px_8px_0px_0px_black]',
        className
      )}
    >
      {/* Terminal header */}
      <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-2">
        <span className="text-xs uppercase tracking-[1.2px] text-primary-foreground">{title}</span>

        <div className="flex items-center gap-1">
          <span className="size-3 bg-primary-foreground" />
          <span className="size-3 bg-primary-foreground/50" />
        </div>
      </div>

      {/* Card body */}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
