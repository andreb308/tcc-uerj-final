'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TargetLanguage, intakeFormSchema, type IntakeFormData } from '@/lib/schemas/report';

import { useRouter } from 'next/navigation';
import { ArrowRightIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { createReportAction } from '@/app/actions/report';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from '@/components/ui/combobox';
import dynamic from 'next/dynamic';
import type { LyricLine } from './lyrics-modal';
import Image from 'next/image';

// Lazily load the LyricsModal component to reduce the initial JavaScript bundle size.
const LyricsModal = dynamic(() => import('./lyrics-modal').then((mod) => mod.LyricsModal));

// Note: intakeFormSchema and IntakeFormData are now imported from @/lib/schemas/report

interface FormFieldRowProps {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}

function FormFieldRow({ label, htmlFor, children }: FormFieldRowProps) {
  return (
    <div className="flex h-12 items-stretch border-b border-border">
      <div className="flex w-40 shrink-0 items-center justify-center border-r border-border bg-muted px-4">
        <Label
          htmlFor={htmlFor}
          className="w-full h-full flex items-center text-xs uppercase tracking-wider text-muted-foreground"
        >
          {label}
        </Label>
      </div>
      <div className="relative flex flex-1 items-center bg-background">{children}</div>
    </div>
  );
}

interface MBArtistResult {
  id: string;
  name: string;
}

interface GeniusSong {
  id: number;
  title: string;
  artist: string;
  fullTitle: string;
  albumCover?: {
    small?: string;
    medium?: string;
    big?: string;
    xl?: string;
  } | null;
}

export function IntakeForm() {
  const router = useRouter();
  // artistInputValue drives the combobox input and the debounced search query
  const [artistInputValue, setArtistInputValue] = useState('');
  const [songInputValue, setSongInputValue] = useState('');
  const [debouncedArtist, setDebouncedArtist] = useState('');
  const [debouncedSong, setDebouncedSong] = useState('');
  const [selectedSong, setSelectedSong] = useState<GeniusSong | null>(null);

  const { register, handleSubmit, control, watch, setValue, getValues } = useForm<IntakeFormData>({
    resolver: zodResolver(intakeFormSchema),
    defaultValues: {
      artist: '',
      trackTitle: '',
      targetLanguage: TargetLanguage.English,
      artifactData: '',
      albumCover: null,
    },
  });

  const artifactData = watch('artifactData');

  // Debounce the artist input before firing the API query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedArtist(artistInputValue);
    }, 200);
    return () => clearTimeout(timer);
  }, [artistInputValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSong(songInputValue);
    }, 200);
    return () => clearTimeout(timer);
  }, [songInputValue]);

  const { data: artistResults = [], isFetching } = useQuery({
    queryKey: ['artist-search', debouncedArtist],
    queryFn: async () => {
      if (!debouncedArtist) return [];
      const params = new URLSearchParams({ q: debouncedArtist.trim() });
      const res = await fetch(`/api/artists/search?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      return (data.results ?? []) as MBArtistResult[];
    },
    enabled: debouncedArtist.trim().length >= 1,
  });

  const { data: songResults = [], isFetching: isSongFetching } = useQuery({
    queryKey: ['song-search', debouncedSong, artistInputValue],
    queryFn: async () => {
      if (!debouncedSong.trim() && !artistInputValue.trim()) return [];
      const params = new URLSearchParams({
        q: debouncedSong.trim(),
        artist: artistInputValue.trim(),
      });
      const res = await fetch(`/api/songs/search?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      return (data.results || []) as GeniusSong[];
    },
    enabled: debouncedSong.trim().length >= 0,
  });

  const handleLyricsConfirm = (lines: LyricLine[]) => {
    const formattedText = lines
      .map((line) => {
        let text = `[${line.number}] ${line.text}`;
        if (line.annotation) {
          text += `\n/* ${line.annotation} */`;
        }
        return text;
      })
      .join('\n\n');

    const current = getValues('artifactData');
    setValue('artifactData', current ? `${current}\n\n${formattedText}` : formattedText);
  };

  const onValid = async (data: IntakeFormData) => {
    try {
      // 1. Create report record on the server via Server Action
      const { id } = await createReportAction(data);
      // 2. Navigate to the report page
      toast.success('Protocol executed successfully!');
      router.push(`/report/${id}`);
    } catch (err) {
      toast.error('An error occurred during submission');
    }
  };

  const onInvalid = (errors: Record<string, { message?: string }>) => {
    const messages = Object.values(errors)
      .map((err) => err.message)
      .filter(Boolean);

    if (messages.length > 0) {
      toast.error(messages.map((msg, i) => <p key={i}>{msg}</p>));
    }
  };

  return (
    <form onSubmit={handleSubmit(onValid, onInvalid)} className="flex min-h-0 flex-1 flex-col">
      {/* Artist ID */}
      <FormFieldRow label="Artist_Name" htmlFor="artist-id">
        <Combobox
          items={artistResults.map((a) => a.name)}
          inputValue={artistInputValue}
          onInputValueChange={(val) => setArtistInputValue(val)}
          onValueChange={(name) => {
            if (name) setValue('artist', name as string, { shouldValidate: true });
          }}
        >
          <ComboboxInput
            id="artist-id"
            placeholder="ENTER_NAME..."
            showTrigger={false}
            className="h-full w-full border-0 bg-transparent text-sm placeholder:uppercase placeholder:text-muted-foreground/50 focus-visible:ring-0"
          />
          <ComboboxContent>
            <ComboboxList>
              <ComboboxEmpty>{isFetching ? 'Loading...' : 'The list is empty.'}</ComboboxEmpty>
              {artistResults.map((artist) => (
                <ComboboxItem key={artist.id} value={artist.name}>
                  {artist.name}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </FormFieldRow>

      {/* Track Title */}
      <FormFieldRow label="Track_Title" htmlFor="track-title">
        <Combobox
          items={songResults.map((s) => s.title)}
          inputValue={songInputValue}
          onInputValueChange={(val) => {
            setSongInputValue(val);
            setValue('trackTitle', val);
            // Clear selected song if user edits the input manually
            if (selectedSong && val !== selectedSong.title) {
              setSelectedSong(null);
              setValue('artifactData', '');
              setValue('albumCover', null);
            }
          }}
          onValueChange={(title) => {
            if (!title) return;
            const song = songResults.find((s) => s.title === (title as string));
            if (song) {
              setValue('trackTitle', song.title, { shouldValidate: true });
              setSelectedSong(song);
              setValue('artifactData', '');
              setValue('albumCover', song.albumCover || null, { shouldValidate: true });
            }
          }}
        >
          <ComboboxInput
            id="track-title"
            placeholder="ENTER_TITLE..."
            showTrigger={false}
            className="h-full w-full border-0 bg-transparent text-sm placeholder:uppercase placeholder:text-muted-foreground/50 focus-visible:ring-0"
          />
          <ComboboxContent>
            <ComboboxList>
              <ComboboxEmpty>{isSongFetching ? 'Loading...' : 'The list is empty.'}</ComboboxEmpty>
              {songResults.map((song) => (
                <ComboboxItem key={song.id} value={song.title} className="pl-2">
                  {song.albumCover?.small ? (
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-sm border border-border">
                      <Image
                        src={song.albumCover.small}
                        alt={`${song.title} album cover`}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                  ) : (
                    <div className="size-10 shrink-0 rounded-sm border border-border bg-muted flex items-center justify-center text-[10px] text-muted-foreground uppercase font-mono">
                      No Art
                    </div>
                  )}
                  <div className="flex flex-col min-w-0 leading-tight">
                    <span className="truncate font-semibold text-foreground">{song.title}</span>
                    <span className="truncate text-[10px] text-muted-foreground">{song.artist}</span>
                  </div>
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </FormFieldRow>

      {/* Target Language — controlled via Controller since base-ui Select doesn't expose a native ref */}
      <FormFieldRow label="Target_Lang" htmlFor="target-lang">
        <Controller
          control={control}
          name="targetLanguage"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="h-full w-full border-0 bg-transparent text-sm focus-visible:ring-0">
                <SelectValue placeholder="Select language..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TargetLanguage).map(([key, value]) => (
                  <SelectItem key={value} value={value}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormFieldRow>

      {/* Artifact Data (Lyrics) */}
      <div className="flex min-h-0 flex-1 flex-col border-b border-border">
        <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-2">
          <Label
            htmlFor="artifact-data"
            className="text-xs uppercase tracking-wider text-foreground"
          >
            Artifact_Data (Lyrics)
          </Label>
          <span className="text-[10px] uppercase text-foreground/60">RAW_TEXT_ONLY</span>
        </div>

        {/* Action Row & Artifact Data Area */}
        {artifactData ? (
          <ScrollArea className="relative h-[300px] w-full border-0 bg-background p-4 overflow-hidden">
            <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground select-text">
              {artifactData}
            </pre>
            <Button
              type="button"
              variant="outline"
              onClick={() => setValue('artifactData', '')}
              className="absolute bottom-2 right-2 hover:bg-destructive hover:text-secondary text-xs font-bold bg-destructive/20 text-foreground font-mono uppercase hover:underline cursor-pointer"
            >
              [ RESET ]
            </Button>
          </ScrollArea>
        ) : (
          <div className="flex min-h-64 flex-1 flex-col items-center justify-center bg-background p-6">
            {selectedSong ? (
              <div className="flex flex-col items-center gap-6">
                {selectedSong.albumCover?.medium && (
                  <div className="relative size-32 overflow-hidden rounded-md border border-border shadow-md">
                    <Image
                      src={selectedSong.albumCover.medium}
                      alt={`${selectedSong.title} album cover`}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  </div>
                )}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 text-destructive">
                    <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                    <span className="font-mono text-xs font-bold uppercase tracking-widest">
                      Target Acquired
                    </span>
                  </div>
                  <span className="font-mono text-[10px] uppercase text-muted-foreground text-center max-w-[280px] truncate">
                    {selectedSong.title} by {selectedSong.artist}
                  </span>
                  <span className="font-mono text-[10px] uppercase text-muted-foreground/60">
                    Protocol ready for extraction
                  </span>
                </div>

                <LyricsModal
                  songId={selectedSong.id}
                  songTitle={selectedSong.title}
                  artistName={selectedSong.artist}
                  onConfirm={handleLyricsConfirm}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
                <span className="font-mono text-sm uppercase tracking-widest">
                  Awaiting Track Selection
                </span>
                <span className="font-mono text-[10px] uppercase">
                  Input artist and title to proceed
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Execute Button */}
      <Button
        type="submit"
        variant="ghost"
        className="w-full gap-3 flex items-center justify-center py-8 font-display text-sm font-bold uppercase tracking-[2.1px] text-foreground hover:bg-foreground hover:text-background cursor-pointer"
      >
        [ EXECUTE PROTOCOL ]
        <ArrowRightIcon className="size-3" weight="bold" />
      </Button>
    </form>
  );
}
