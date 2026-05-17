import { NextRequest, NextResponse } from 'next/server';
import { findLyrics } from './lyricSearch';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const songId = Number(id);

  if (!songId || isNaN(songId)) {
    return NextResponse.json({ error: 'Invalid song ID' }, { status: 400 });
  }
  
  const artist = request.nextUrl.searchParams.get('artist');
  const title = request.nextUrl.searchParams.get('title');

  if (!artist || !title) {
    return NextResponse.json({ error: 'Missing artist or title parameters' }, { status: 400 });
  }

  try {
    const rawLyrics: string = await findLyrics(title, artist);

    // Parse raw lyrics into structured lines
    const lines = rawLyrics.split('\n').filter((line: string) => line.trim() !== '');

    const lyricsData = lines.map((line: string, index: number) => {
      const trimmed = line.trim();
      const isSectionHeader = /^\[.*\]$/.test(trimmed);

      return {
        number: String(index + 1).padStart(2, '0'),
        text: isSectionHeader ? '' : trimmed,
        ...(isSectionHeader ? { annotation: trimmed } : {}),
      };
    });

    // Filter out empty text lines (section headers become annotation-only)
    const lyrics = lyricsData.filter(
      (l: { text: string; annotation?: string }) => l.text !== '' || l.annotation
    );

    return NextResponse.json({
      lyrics,
      title,
      artist,
      fullTitle: `${artist} - ${title}`,
    });
  } catch (error) {
    console.error('Failed to fetch lyrics:', error);
    return NextResponse.json({ error: 'Failed to fetch lyrics' }, { status: 500 });
  }
}
