'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useRouter } from 'next/navigation';
import { ArrowRightIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
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

export function IntakeForm() {
  const router = useRouter();
  const [artistInput, setArtistInput] = useState('');
  const [debouncedArtist, setDebouncedArtist] = useState('');

  // Update debounced value after 1 second of no typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedArtist(artistInput);
    }, 1000);
    return () => clearTimeout(timer);
  }, [artistInput]);

  const { data: artistResults = [], isFetching } = useQuery({
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
    enabled: debouncedArtist.trim().length >= 4,
    // Add a refetchInterval if the strict requirement is to poll every second.
    // Assuming "every second without typing" means 1 second debounce.
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        toast.success('Protocol executed successfully!');
        router.push('/report');
      }}
      className="flex flex-col"
    >
      {/* Artist ID */}
      <FormFieldRow label="Artist_ID" htmlFor="artist-id">
        <Input
          id="artist-id"
          list="artist-suggestions"
          placeholder="ENTER_NAME..."
          value={artistInput}
          onChange={(e) => setArtistInput(e.target.value)}
          className="h-full w-full border-0 bg-transparent text-sm placeholder:uppercase placeholder:text-muted-foreground/50 focus-visible:ring-0"
        />
        {(!isFetching || artistInput === debouncedArtist) && (
          <datalist id="artist-suggestions">
            {artistResults.map((artist: DiscogsArtist) => (
              <option key={artist.id} value={artist.title} />
            ))}
          </datalist>
        )}
      </FormFieldRow>

      {/* Track Title */}
      <FormFieldRow label="Track_Title" htmlFor="track-title">
        <Input
          id="track-title"
          placeholder="ENTER_TITLE..."
          className="h-full border-0 bg-transparent text-sm placeholder:uppercase placeholder:text-muted-foreground/50 focus-visible:ring-0"
        />
      </FormFieldRow>

      {/* Target Language */}
      <FormFieldRow label="Target_Lang" htmlFor="target-lang">
        <Select defaultValue="simple-english">
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
      </FormFieldRow>

      {/* Artifact Data (Lyrics) */}
      <div className="flex flex-col border-b border-border">
        <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-2">
          <Label
            htmlFor="artifact-data"
            className="text-xs uppercase tracking-wider text-foreground"
          >
            Artifact_Data (Lyrics)
          </Label>
          <span className="text-[10px] uppercase text-foreground/60">RAW_TEXT_ONLY</span>
        </div>

        <Textarea
          id="artifact-data"
          placeholder={`PASTE ARTIFACT DATA HERE.\n> LINE 1\n> LINE 2\n> ...`}
          className="min-h-[300px] border-0 bg-background text-sm placeholder:uppercase placeholder:text-muted-foreground/40 focus-visible:ring-0"
        />
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
