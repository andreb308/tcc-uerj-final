export function BackgroundOverlay() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 bg-[rgba(230,228,222,0.3)]"
      aria-hidden="true"
    >
      {/* Horizontal Dividers */}
      <div className="absolute top-[25%] left-0 w-full h-px bg-black/10" />
      <div className="absolute top-[50%] left-0 w-full h-px bg-black/10" />
      <div className="absolute top-[75%] left-0 w-full h-px bg-black/10" />
      {/* Vertical Dividers */}
      <div className="absolute left-[25%] top-0 h-full w-px bg-black/10" />
      <div className="absolute left-[50%] top-0 h-full w-px bg-black/10" />
      <div className="absolute left-[75%] top-0 h-full w-px bg-black/10" />
      {/* [SEMANTIC_VECTORIZATION] */}
      <div className="absolute left-[10%] top-[15%] flex flex-col items-start">
        <div className="border border-black/20 px-2 py-1.5 bg-background/50 backdrop-blur-sm">
          <span className="text-[10px] font-mono text-muted-foreground uppercase leading-none">
            [SEMANTIC_VECTORIZATION]
          </span>
        </div>
        <div className="absolute left-full top-1/2 w-12 h-px bg-black/20 -translate-y-1/2" />
      </div>
      {/* [SYNTACTIC_PARSING] */}
      <div className="absolute right-[5%] top-[40%] flex flex-col items-start">
        <div className="border border-black/20 px-2 py-1.5 bg-background/50 backdrop-blur-sm">
          <span className="text-[10px] font-mono text-muted-foreground uppercase leading-none">
            [SYNTACTIC_PARSING]
          </span>
        </div>
        <div className="absolute right-full top-1/2 w-16 h-px bg-black/20 -translate-y-1/2" />
      </div>
      {/* [LEXICAL_EXTRACTION] */}
      <div className="absolute left-[15%] bottom-[20%] flex flex-col items-start">
        <div className="border border-black/20 px-2 py-1.5 bg-background/50 backdrop-blur-sm relative">
          <span className="text-[10px] font-mono text-muted-foreground uppercase leading-none">
            [LEXICAL_EXTRACTION]
          </span>
          <div className="absolute bottom-full left-1/2 w-px h-12 bg-black/20 -translate-x-1/2" />
        </div>
      </div>
      {/* [CONTEXTUAL_ARCHIVING] */}
      <div className="absolute right-[20%] bottom-[10%] flex flex-col items-start">
        <div className="border border-black/20 px-2 py-1.5 bg-background/50 backdrop-blur-sm relative">
          <span className="text-[10px] font-mono text-muted-foreground uppercase leading-none">
            [CONTEXTUAL_ARCHIVING]
          </span>
          <div className="absolute right-full top-1/2 w-12 h-px bg-black/20 -translate-y-1/2" />
        </div>
      </div>
      {/* Central SVG Pattern */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(800px,80vw)] h-[min(800px,80vw)] opacity-[0.07]">
        <svg viewBox="0 0 100 100" className="w-full h-full text-black">
          {/* Main circles */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray="1 1"
          />
          <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.2" />
          <circle
            cx="50"
            cy="50"
            r="30"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.1"
            strokeDasharray="4 4"
          />

          {/* Diagonal lines */}
          <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" strokeWidth="0.1" />
          <line x1="100" y1="0" x2="0" y2="100" stroke="currentColor" strokeWidth="0.1" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="0.05" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.05" />

          {/* Inner compass-like detail */}
          <path d="M50 45 L50 55 M45 50 L55 50" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="2" fill="none" stroke="currentColor" strokeWidth="0.2" />
        </svg>
      </div>
      {/* Status Header Text */}
      <div className="absolute left-1/2 top-[10%] -translate-x-1/2 text-[9px] font-mono text-muted-foreground/40 tracking-[0.2em] uppercase whitespace-nowrap">
        NETWORK_STATUS: OPERATIONAL // BUFFER_LOAD: 0.04% // NODE_COUNT: 12,402
      </div>
    </div>
  );
}
