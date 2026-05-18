import type { UIMessage } from 'ai';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';

export function InstructorBlock({ message }: { message: UIMessage }) {
  const textContent = message.parts
    ?.filter((p) => p.type === 'text')
    .map((p) => ('text' in p ? (p.text as string) : ''))
    .join('\n');

  return (
    <div className="flex flex-col gap-2">
      {/* Label Row */}
      <div className="flex items-center bg gap-2 pb-1">
        <span className="bg-primary text-primary-foreground px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider rounded-sm">
          Instructor
        </span>
        <div className="flex-1 h-px bg-black/20" />
      </div>

      {/* Message Card */}
      <Message from="assistant" className="max-w-11/12">
        <MessageContent className="border border-ink rounded-[2px] p-[25px] bg-paper-dim drop-shadow-[4px_4px_0px_#1c100d] group-[.is-assistant]:text-foreground w-full">
          <MessageResponse className="font-mono text-[14px] leading-[22.75px] uppercase whitespace-pre-wrap">
            {textContent || ''}
          </MessageResponse>
        </MessageContent>
      </Message>
    </div>
  );
}

export function LearnerBlock({ message }: { message: UIMessage }) {
  const textContent = message.parts
    ?.filter((p) => p.type === 'text')
    .map((p) => ('text' in p ? (p.text as string) : ''))
    .join('\n');

  return (
    <div className="flex flex-col gap-2 pl-12">
      {/* Label Row */}
      <div className="flex items-center gap-2 pb-1 justify-end">
        <div className="flex-1 h-px bg-destructive/20" />
        <span className="border border-ink bg-paper px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider rounded-sm">
          Learner
        </span>
      </div>

      {/* Message Body with left border */}
      <Message from="user" className="max-w-5/6  pl-8">
        <MessageContent className="flex flex-row group-[.is-user]:rounded-none group-[.is-user]:bg-transparent group-[.is-user]:px-0">
          <div className="w-[3px] mr-4 bg-black" />
          <p className="font-display text-[16px] leading-[24px] text-ink whitespace-pre-wrap">
            {textContent || ''}
          </p>
        </MessageContent>
      </Message>
    </div>
  );
}
