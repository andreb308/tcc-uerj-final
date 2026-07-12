'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalTrigger,
  useModal,
} from '@/components/ui/animated-modal';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CircleNotchIcon } from '@phosphor-icons/react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export interface LyricLine {
  number: string;
  text: string;
  annotation?: string;
}

interface LyricsModalProps {
  songId: number;
  songTitle: string;
  artistName: string;
  onConfirm: (selectedLines: LyricLine[]) => void;
}

// Inner component that handles fetching and selecting lyrics once the modal is open
function LyricsSelector({ songId, songTitle, artistName, onConfirm }: LyricsModalProps) {
  const { setOpen } = useModal();
  const [selectedLines, setSelectedLines] = useState<Set<number>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [selectAll, setSelectAll] = useState(false);

  const { data: lyricsData, isLoading } = useQuery<{
    lyrics: LyricLine[];
    title: string;
    artist: string;
  }>({
    queryKey: ['lyrics', songId],
    queryFn: async () => {
      const params = new URLSearchParams({
        artist: artistName,
        title: songTitle,
      });
      const res = await fetch(`/api/songs/${songId}/lyrics?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch lyrics');
      return res.json();
    },
    // Only fetch if a valid songId is provided
    enabled: !!songId && songId > 0,
  });

  const toggleLine = (index: number) => {
    if (selectAll) return;

    let newSelected = new Set(selectedLines);

    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }

    // Enforce contiguous sequential selection block
    if (newSelected.size > 1) {
      const indices = Array.from(newSelected);
      const min = Math.min(...indices);
      const max = Math.max(...indices);

      newSelected = new Set();
      for (let i = min; i <= max; i++) {
        if (lyricsData?.lyrics[i]?.text) {
          newSelected.add(i);
        }
      }
    }

    setSelectedLines(newSelected);
  };

  const handleConfirm = () => {
    if (!lyricsData) return;

    let selected: LyricLine[];
    if (selectAll) {
      selected = lyricsData.lyrics.filter((l) => l.text);
    } else {
      selected = Array.from(selectedLines)
        .sort((a, b) => a - b) // Ensure chronological order
        .map((index) => lyricsData.lyrics[index]);
    }

    onConfirm(selected);
    setOpen(false);
  };

  return (
    <ModalBody className="md:max-w-3xl h-[85vh] flex flex-col p-0">
      <div className="border-b border-border bg-muted/50 p-6 z-10 shrink-0">
        <h4 className="font-display text-2xl font-bold uppercase tracking-tight">
          Select Evidence
        </h4>
        <p className="font-mono text-sm text-muted-foreground uppercase mt-1">
          {songTitle} {artistName ? `// ${artistName}` : ''}
        </p>
      </div>

      <ModalContent className="flex-1 min-h-0 flex flex-col p-0 rounded-none bg-paper">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center p-12">
            <div className="flex flex-col items-center gap-4">
              <CircleNotchIcon
                className="h-8 w-8 animate-spin text-muted-foreground"
                weight="bold"
              />
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Extracting Protocol Data...
              </p>
            </div>
          </div>
        ) : !lyricsData?.lyrics || lyricsData.lyrics.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-12">
            <p className="font-mono text-sm uppercase text-muted-foreground">
              No lyrics found for this item.
            </p>
          </div>
        ) : (
          <ScrollArea className="flex-1 min-h-0 w-full">
            <div className="p-4 flex flex-col gap-1">
              {lyricsData.lyrics.map((line, index) => {
                const isSelected = selectedLines.has(index);

                if (line.annotation && !line.text) {
                  return (
                    <div key={`ann-${index}`} className="mt-6 mb-2 first:mt-0 px-2">
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {line.annotation}
                      </span>
                    </div>
                  );
                }

                return (
                  <button
                    type="button"
                    key={`${line.number}-${index}`}
                    onClick={() => toggleLine(index)}
                    className={cn(
                      'group relative flex w-full items-start gap-3 rounded-sm p-3 text-left transition-colors border border-transparent',
                      isSelected && !selectAll
                        ? 'bg-destructive/10 border-destructive/20 shadow-[0_0_0_1px_rgba(242,59,13,0.1)]'
                        : 'hover:bg-muted/50 hover:border-border',
                      selectAll && 'opacity-50 pointer-events-none'
                    )}
                  >
                    <div className="flex h-6 items-center shrink-0 pointer-events-none">
                      <Checkbox
                        checked={selectAll ? true : isSelected}
                        className={cn(
                          'data-[state=checked]:bg-destructive data-[state=checked]:border-destructive',
                          !isSelected &&
                            !selectAll &&
                            'opacity-0 group-hover:opacity-100 transition-opacity'
                        )}
                        aria-label={`Select line ${line.number}`}
                      />
                    </div>

                    <span className="flex h-6 items-center shrink-0 font-mono text-[10px] text-foreground/40 w-6">
                      {line.number}
                    </span>

                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      {line.annotation && (
                        <div className="border-l-2 border-destructive pl-2.5">
                          <span className="font-mono text-xs italic text-foreground/60 block truncate">
                            {line.annotation}
                          </span>
                        </div>
                      )}
                      <span
                        className={cn(
                          'font-display text-lg font-medium transition-colors',
                          isSelected || selectAll ? 'text-destructive' : 'text-foreground'
                        )}
                      >
                        {line.text}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </ModalContent>

      <ModalFooter className="border-t border-border bg-muted/50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between shrink-0 rounded-none w-full relative z-60 gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="flex items-center gap-2 cursor-pointer group">
            <Checkbox
              checked={selectAll}
              onCheckedChange={(checked) => setSelectAll(checked === true)}
              className="data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
            />
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
              Select Entire Song
            </span>
          </label>
          {!selectAll && (
            <div className="hidden sm:flex items-center gap-4 ml-4 border-l border-border pl-4">
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {selectedLines.size} {selectedLines.size === 1 ? 'Line' : 'Lines'} Selected
              </span>
              {selectedLines.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedLines(new Set())}
                  className="font-mono text-[10px] uppercase tracking-widest text-destructive hover:text-destructive/80 transition-colors underline underline-offset-4"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="font-mono uppercase text-xs flex-1 sm:flex-none tracking-widest bg-background"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!selectAll && selectedLines.size === 0}
            className="font-mono uppercase text-xs flex-1 sm:flex-none tracking-widest bg-foreground text-background hover:bg-foreground/80 disabled:opacity-50"
          >
            Confirm
          </Button>
        </div>
      </ModalFooter>
    </ModalBody>
  );
}

export function LyricsModal({ songId, songTitle, artistName, onConfirm }: LyricsModalProps) {
  return (
    <Modal>
      <ModalTrigger
        className={cn(
          'w-full sm:w-auto h-12 inline-flex items-center justify-center gap-2 rounded-none px-6',
          'font-mono text-xs font-bold uppercase tracking-widest transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'bg-muted hover:bg-muted/80 text-foreground border border-border'
        )}
      >
        [ FETCH_EVIDENCE ]
      </ModalTrigger>
      {/* We use an inner component so it can access useModal() and control setOpen */}
      <LyricsSelector
        songId={songId}
        songTitle={songTitle}
        artistName={artistName}
        onConfirm={onConfirm}
      />
    </Modal>
  );
}
