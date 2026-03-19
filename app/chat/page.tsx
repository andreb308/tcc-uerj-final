'use client';

import { useState } from 'react';
import { ArrowLeftIcon, ArrowRightIcon, LightningIcon } from '@phosphor-icons/react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// ---------- Types ----------
interface LyricLine {
  number: string;
  text: string;
  translation?: string;
}

interface ChatMessage {
  role: 'instructor' | 'learner' | 'system';
  content: string;
  highlightedPhrase?: string;
  actions?: { label: string }[];
}

// ---------- Sample data (matches Figma design) ----------
const LYRICS: LyricLine[] = [
  {
    number: '01',
    text: 'Loving you is complicated',
    translation: '[loving yourself is complicated]',
  },
  { number: '02', text: 'Loving you is complicated' },
  {
    number: '03',
    text: 'I place blame on you still',
    translation: '[I still blame you for everything]',
  },
  { number: '04', text: 'Place shame on you still' },
  { number: '05', text: "Feel like you ain't shit" },
  {
    number: '06',
    text: "Feel like you don't feel confidence in yourself",
    translation: '[Your confidence has been eroded]',
  },
  { number: '07', text: "Breakin' on marble floors" },
  { number: '08', text: "Watchin' anonymous strangers" },
];

const MESSAGES: ChatMessage[] = [
  {
    role: 'instructor',
    content: `ANALYSIS PROTOCOL INITIATED. DETECTING STRONG THEMES OF SELF-LOATHING, SURVIVOR'S GUILT, AND DUALITY.\n\nNOTE THE USE OF THE SECOND PERSON "YOU". THE SPEAKER IS ADDRESSING HIMSELF IN A MIRROR, CREATING A DISSOCIATIVE EFFECT.\n\nSELECT A LINE FROM THE EVIDENCE PANE TO BEGIN DECONSTRUCTION.`,
  },
  {
    role: 'learner',
    content:
      'What does "place blame on you still" imply in this context? Is he talking about a specific event?',
  },
  {
    role: 'instructor',
    content: `CORRECT. THIS IS A PIVOTAL LINE. "I PLACE BLAME ON YOU STILL" SUGGESTS AN UNRESOLVED GRIEVANCE.\n\nCONTEXTUALLY, THIS REFERS TO HIS ABSENCE DURING A FAMILY TRAGEDY WHILE HE WAS TOURING. THE GRAMMAR "PLACE BLAME" IS ACTIVE AND DELIBERATE—HE IS ACTIVELY CHOOSING TO CARRY THIS BURDEN. IT IS NOT PASSIVE GUILT; IT IS AN ACTIVE ACCUSATION AGAINST THE SELF.`,
    highlightedPhrase: '"I PLACE BLAME ON YOU STILL"',
    actions: [{ label: "Define: 'Place Blame'" }, { label: 'Context: 2015 Era' }],
  },
];

const METADATA = {
  artistId: 'Kendrick Lamar',
  artifact: 'u',
  year: '2015',
};

// ---------- Sub-components ----------

function MetadataCell({
  label,
  value,
  hasBorder = true,
}: {
  label: string;
  value: string;
  hasBorder?: boolean;
}) {
  return (
    <div className={`flex-1 ${hasBorder ? 'border-r border-border' : ''}`}>
      <div className="flex flex-col gap-1 px-3 py-3">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="font-mono text-xs font-semibold uppercase tracking-wider">{value}</span>
      </div>
    </div>
  );
}

function LyricLineItem({
  line,
  isActive,
  onClick,
}: {
  line: LyricLine;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex w-full flex-col gap-1 rounded-sm py-2 pl-10 pr-2 text-left transition-colors"
    >
      {/* Line number */}
      <span className="absolute left-2 top-1/2 -translate-y-1/2 font-mono text-[10px] text-foreground/40">
        {line.number}
      </span>

      {/* Translation annotation */}
      {line.translation && (
        <div className="border-l-2 border-destructive pl-2.5">
          <span className="font-mono text-xs italic text-foreground/60">{line.translation}</span>
        </div>
      )}

      {/* Lyric text */}
      {isActive ? (
        <div className="flex items-center gap-2">
          <span className="inline-block rounded-sm bg-destructive/20 px-1 font-display text-lg font-medium shadow-[0_0_0_1px_rgba(242,59,13,0.2)]">
            {line.text}
          </span>
          <ArrowLeftIcon className="size-3.5 text-destructive" weight="bold" />
        </div>
      ) : (
        <span className="font-display text-lg font-medium">{line.text}</span>
      )}
    </button>
  );
}

function InstructorMessage({ message }: { message: ChatMessage }) {
  const paragraphs = message.content.split('\n\n');

  return (
    <div className="flex flex-col gap-2">
      {/* Label row */}
      <div className="flex items-center gap-2 pb-1">
        <Badge
          variant="default"
          className="rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider"
        >
          Instructor
        </Badge>
        <Separator className="flex-1 bg-foreground/20" />
      </div>

      {/* Message card */}
      <Card className="border border-border bg-card shadow-[4px_4px_0px_0px_var(--foreground)]">
        <CardContent className="space-y-4 px-6 py-5">
          {paragraphs.map((p, i) => {
            if (message.highlightedPhrase && p.includes(message.highlightedPhrase)) {
              const parts = p.split(message.highlightedPhrase);
              return (
                <p key={i} className="font-mono text-sm leading-relaxed uppercase">
                  {parts[0]}
                  <mark className="rounded-sm bg-destructive/20 px-1">
                    {message.highlightedPhrase}
                  </mark>
                  {parts[1]}
                </p>
              );
            }
            return (
              <p key={i} className="font-mono text-sm leading-relaxed uppercase">
                {p}
              </p>
            );
          })}

          {/* Action buttons */}
          {message.actions && (
            <div className="flex gap-2 pt-2">
              <TooltipProvider>
                {message.actions.map((action) => (
                  <Tooltip key={action.label}>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="outline"
                          size="xs"
                          className="font-mono text-[10px] uppercase"
                        >
                          {action.label}
                        </Button>
                      }
                    />
                    <TooltipContent>
                      <p>Click to explore</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LearnerMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex flex-col gap-2 pl-12">
      {/* Label row */}
      <div className="flex items-center gap-2 pb-1">
        <Separator className="flex-1 bg-destructive/20" />
        <Badge
          variant="outline"
          className="rounded-sm border-border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider"
        >
          Learner
        </Badge>
      </div>

      {/* Message content */}
      <div className="ml-16 border-l-2 border-border py-6 pl-6 pr-6">
        <p className="font-display text-base leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
}

function SystemEvent({ text }: { text: string }) {
  return (
    <div className="flex justify-center py-2">
      <div className="flex items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/10 px-3 py-1">
        <LightningIcon className="size-3 text-destructive" weight="fill" />
        <span className="font-mono text-[10px] uppercase tracking-wider text-destructive">
          {text}
        </span>
      </div>
    </div>
  );
}

// ---------- Main page ----------
export default function ChatPage() {
  const [activeLine, setActiveLine] = useState<string>('03');
  const [inputValue, setInputValue] = useState('');

  return (
    <div className="flex h-dvh flex-col bg-paper font-mono text-foreground">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-paper px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex size-6 items-center justify-center rounded-sm bg-foreground">
            <ArrowLeftIcon className="size-3 text-background" weight="bold" />
          </div>
          <h2 className="font-display text-lg font-bold uppercase tracking-tight">
            THE_ARCHIVE [v.1.0]
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs uppercase tracking-widest text-foreground/60">
            Session ID: #8821X
          </span>
          <Badge variant="default" className="rounded-sm font-mono text-xs">
            14:22 UTC
          </Badge>
        </div>
      </header>

      {/* Main workspace */}
      <div className="flex min-h-0 flex-1">
        {/* Left Pane — The Evidence */}
        <div className="flex w-[40%] flex-col border-r border-border bg-paper-dim">
          {/* Metadata row */}
          <div className="border-b border-border bg-paper-dim">
            <div className="flex">
              <MetadataCell label="Artist_ID" value={METADATA.artistId} />
              <MetadataCell label="Artifact" value={METADATA.artifact} />
              <MetadataCell label="Year" value={METADATA.year} hasBorder={false} />
            </div>
          </div>

          {/* Lyric viewer */}
          <div className="relative flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="flex flex-col gap-6 px-4 pb-32 pt-8">
                {LYRICS.map((line) => (
                  <LyricLineItem
                    key={line.number}
                    line={line}
                    isActive={activeLine === line.number}
                    onClick={() => setActiveLine(line.number)}
                  />
                ))}
              </div>
            </ScrollArea>

            {/* Sticky footer */}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-border bg-paper px-2 py-2">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-destructive" />
                <span className="text-[10px] uppercase">Live Artifact</span>
              </div>
              <span className="text-[10px] uppercase text-foreground/60">
                Lines: 64 / Duration: 4:32
              </span>
            </div>
          </div>
        </div>

        {/* Right Pane — The Interrogation */}
        <div className="relative flex w-[60%] flex-col bg-paper">
          {/* Chat stream */}
          <ScrollArea className="min-h-0 flex-1 overflow-hidden">
            <div className="flex flex-col gap-12 px-8 pb-40 pt-8">
              {/* Session log start */}
              <div className="border-b border-foreground/20 pb-4">
                <p className="text-center font-mono text-xs uppercase tracking-widest text-foreground/40">
                  [ SESSION LOG START: 14:22:01 ]
                </p>
              </div>

              {/* Messages */}
              {MESSAGES.map((msg, i) => {
                if (msg.role === 'instructor') {
                  return <InstructorMessage key={i} message={msg} />;
                }
                if (msg.role === 'learner') {
                  return <LearnerMessage key={i} message={msg} />;
                }
                return null;
              })}

              {/* System event */}
              <SystemEvent text="Insight Generated" />
            </div>
          </ScrollArea>

          {/* Input area — pinned to bottom */}
          <div className="absolute inset-x-0 bottom-0 border-t border-border bg-paper px-6 pb-6 pt-6">
            <div className="relative flex items-center">
              {/* Prompt chevron */}
              <span className="absolute left-4 z-10 font-mono text-xl font-semibold text-destructive">
                {'>'}
              </span>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="INTERROGATE THE TEXT..."
                className="h-14 border-destructive bg-paper pl-10 pr-14 font-mono text-sm uppercase placeholder:text-foreground/30"
              />
              <Button
                size="icon-lg"
                className="absolute right-2 rounded-sm bg-foreground text-background hover:bg-foreground/80"
              >
                <ArrowRightIcon className="size-4" weight="bold" />
              </Button>
            </div>

            <div className="mt-2 flex items-center justify-between px-1">
              <span className="text-[10px] uppercase text-foreground/40">
                Shift + Enter for new line
              </span>
              <span className="text-[10px] uppercase text-foreground/40">Status: Connected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
