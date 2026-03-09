export function StatusBar() {
  return (
    <footer className="mt-auto flex items-center justify-between border-t border-border bg-background px-6 py-2">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-success" />
          <span className="text-[10px] uppercase text-muted-foreground">SYSTEM_READY</span>
        </div>

        <span className="text-[10px] uppercase text-muted-foreground">MEM: 64MB OK</span>

        <span className="text-[10px] uppercase text-muted-foreground">NET: CONNECTED</span>
      </div>

      <span className="text-[10px] uppercase text-muted-foreground">
        SECURE CONNECTION // TLS 1.3
      </span>
    </footer>
  );
}
