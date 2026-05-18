import { useCallback, useEffect, useRef } from 'react';
import type { UIMessage } from 'ai';
import { ArrowRightIcon } from '@phosphor-icons/react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { InstructorBlock, LearnerBlock } from './message-blocks';

interface InterrogationPaneProps {
  messages: UIMessage[];
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e?: React.SubmitEvent) => void;
  status: string;
  sessionStartTime: string;
}

export function InterrogationPane({
  messages,
  input,
  setInput,
  handleSubmit,
  status,
  sessionStartTime,
}: InterrogationPaneProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-slot="scroll-area-viewport"]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.closest('form');
      if (form) form.requestSubmit();
    }
  }, []);

  const isLoading = status === 'streaming' || status === 'submitted';

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-paper">
      {/* Chat Stream */}
      <ScrollArea ref={scrollRef} className="flex-1 min-h-0">
        <div className="flex flex-col gap-12 px-8 pt-8 pb-32">
          {/* Session Start */}
          <div className="border-b border-black/20 pb-4">
            <p className="text-center font-mono text-xs uppercase tracking-widest text-muted-foreground/60">
              [ SESSION LOG START: {sessionStartTime} ]
            </p>
          </div>

          {/* Messages */}
          {messages.map((message) => (
            <div key={message.id}>
              {message.role === 'assistant' ? (
                <InstructorBlock message={message} />
              ) : (
                <LearnerBlock message={message} />
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="bg-ink text-paper px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider rounded-sm">
                  Instructor
                </span>
                <div className="flex-1 h-px bg-black/20" />
              </div>
              <div className="border border-ink rounded-sm p-6 bg-paper-dim drop-shadow-[4px_4px_0px_#1c100d]">
                <div className="flex items-center gap-2">
                  <div className="size-2 bg-alert rounded-full animate-pulse" />
                  <span className="font-mono text-xs uppercase text-muted-foreground animate-pulse">
                    Processing analysis...
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-ink bg-paper px-6 pt-6 pb-6 shrink-0">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="relative flex items-center">
            {/* Red > Prompt */}
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xl font-semibold text-alert select-none z-10">
              {'>'}
            </span>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="INTERROGATE THE TEXT..."
              rows={1}
              className="w-full resize-none border border-alert rounded-sm bg-paper pl-10 pr-16 py-4 font-mono text-sm placeholder:text-muted-foreground/40 placeholder:uppercase focus:outline-none focus:ring-1 focus:ring-alert"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 size-10 flex items-center justify-center bg-ink text-paper rounded-sm disabled:opacity-30 hover:bg-black/80 transition-opacity"
            >
              <ArrowRightIcon className="size-4" weight="bold" />
            </button>
          </div>

          {/* Helper Text */}
          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-[10px] uppercase text-muted-foreground/60">
              Shift + Enter for new line
            </span>
            <span className="font-mono text-[10px] uppercase text-muted-foreground/60">
              Status: {isLoading ? 'Processing...' : 'Connected'}
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
