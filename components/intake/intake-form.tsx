'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useRouter } from 'next/navigation';
import { ArrowRightIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { createReportAction } from '@/app/actions/report';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import dynamic from 'next/dynamic';
import type { LyricLine } from './lyrics-modal';

// Lazily load the LyricsModal component to reduce the initial JavaScript bundle size.
const LyricsModal = dynamic(() => import('./lyrics-modal').then((mod) => mod.LyricsModal));

// --- Form validation schema ---
const intakeFormSchema = z.object({
  artist: z.string().min(1, 'Artist name is required'),
  trackTitle: z.string().min(1, 'Track title is required'),
  targetLanguage: z.string().min(1, 'Target language is required'),
  artifactData: z.string().min(1, 'Lyrics data is required — select a song and extract lyrics'),
});

type IntakeFormData = z.infer<typeof intakeFormSchema>;

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

interface DiscogsArtist {
  id: number;
  title: string;
}

interface GeniusSong {
  id: number;
  title: string;
  artist: string;
  fullTitle: string;
}

export function IntakeForm() {
  const router = useRouter();
  const [debouncedArtist, setDebouncedArtist] = useState('');
  const [debouncedSong, setDebouncedSong] = useState('');
  const [selectedSong, setSelectedSong] = useState<GeniusSong | null>(null);

  const { register, handleSubmit, control, watch, setValue, getValues } = useForm<IntakeFormData>({
    resolver: zodResolver(intakeFormSchema),
    defaultValues: {
      artist: '',
      trackTitle: '',
      targetLanguage: 'simple-english',
      artifactData: '',
    },
  });

  const artistInput = watch('artist');
  const songInput = watch('trackTitle');
  const artifactData = watch('artifactData');

  // Update debounced values after 1 second of no typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedArtist(artistInput);
    }, 1000);
    return () => clearTimeout(timer);
  }, [artistInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSong(songInput);
    }, 1000);
    return () => clearTimeout(timer);
  }, [songInput]);

  const { data: artistResults = [] } = useQuery({
    queryKey: ['artist-search', debouncedArtist],
    queryFn: async () => {
      if (!debouncedArtist) return [];
      const searchParams = new URLSearchParams({
        q: debouncedArtist,
        type: 'artist',
        key: process.env.DISCOGS_API_KEY || '',
        secret: process.env.DISCOGS_SECRET || '',
        per_page: '5',
        page: '0',
      });
      const res = await fetch(`https://api.discogs.com/database/search?${searchParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      let results: DiscogsArtist[] = data.results || [];
      const lowerQuery = debouncedArtist.toLowerCase().trim();

      // Parse the artist titles to remove any parenthesis
      results = results.map((artist) => ({
        ...artist,
        title: artist.title.replace(/\s*\([^)]*\)$/, '').trim(),
      }));

      // Filter out exact matches (case-insensitive)
      results = results.filter((artist) => artist.title.toLowerCase() !== lowerQuery);

      return results.sort((a, b) => {
        const aLower = a.title.toLowerCase();
        const bLower = b.title.toLowerCase();

        const aStarts = aLower.startsWith(lowerQuery);
        const bStarts = bLower.startsWith(lowerQuery);

        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        return a.title.localeCompare(b.title);
      });
    },
    enabled: debouncedArtist.trim().length >= 1,
    // Add a refetchInterval if the strict requirement is to poll every second.
    // Assuming "every second without typing" means 1 second debounce.
  });

  const { data: songResults = [] } = useQuery({
    queryKey: ['song-search', debouncedSong],
    queryFn: async () => {
      if (!debouncedSong) return [];
      const params = new URLSearchParams({ q: debouncedSong });
      if (artistInput.trim()) params.set('artist', artistInput.trim());
      const res = await fetch(`/api/songs/search?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      return (data.results || []) as GeniusSong[];
    },
    enabled: debouncedSong.trim().length >= 1,
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
      <FormFieldRow label="Artist_ID" htmlFor="artist-id">
        <Input
          id="artist-id"
          list="artist-suggestions"
          placeholder="ENTER_NAME..."
          {...register('artist')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault();
          }}
          className="h-full w-full border-0 bg-transparent text-sm placeholder:uppercase placeholder:text-muted-foreground/50 focus-visible:ring-0"
        />
        <datalist id="artist-suggestions">
          {artistResults.map((artist: DiscogsArtist) => (
            <option key={artist.id} value={artist.title} />
          ))}
        </datalist>
      </FormFieldRow>

      {/* Track Title */}
      <FormFieldRow label="Track_Title" htmlFor="track-title">
        <Input
          id="track-title"
          list="song-suggestions"
          autoComplete="off"
          placeholder="ENTER_TITLE..."
          {...register('trackTitle', {
            onChange: (e) => {
              const value = e.target.value;

              // Check if user selected something from datalist
              const song = songResults.find((s: GeniusSong) => s.title === value);
              if (song) {
                setSelectedSong(song);
                setValue('artifactData', '');
              } else if (selectedSong && value !== selectedSong.title) {
                setSelectedSong(null);
                setValue('artifactData', '');
              }
            },
          })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault();
          }}
          className="h-full w-full border-0 bg-transparent text-sm placeholder:uppercase placeholder:text-muted-foreground/50 focus-visible:ring-0"
        />
        <datalist id="song-suggestions">
          {songResults.map((song: GeniusSong) => (
            <option key={song.id} value={song.title}>
              {song.title}
            </option>
          ))}
        </datalist>
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
                <SelectItem value="simple-english">Simple English</SelectItem>
                <SelectItem value="portuguese">Portuguese</SelectItem>
                <SelectItem value="spanish">Spanish</SelectItem>
                <SelectItem value="french">French</SelectItem>
                <SelectItem value="german">German</SelectItem>
                <SelectItem value="japanese">Japanese</SelectItem>
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
          <Textarea
            id="artifact-data"
            value={artifactData}
            readOnly
            className="min-h-64 flex-1 resize-none border-0 bg-background p-4 font-mono text-sm focus-visible:ring-0"
          />
        ) : (
          <div className="flex min-h-64 flex-1 flex-col items-center justify-center bg-background p-6">
            {selectedSong ? (
              <div className="flex flex-col items-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 text-destructive">
                    <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                    <span className="font-mono text-xs font-bold uppercase tracking-widest">
                      Target Acquired
                    </span>
                  </div>
                  <span className="font-mono text-[10px] uppercase text-muted-foreground">
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
