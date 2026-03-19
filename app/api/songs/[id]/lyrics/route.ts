import { NextRequest, NextResponse } from 'next/server';

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
    const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);
    
    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ lyrics: [], title, artist });
      }
      throw new Error(`Lyrics API responded with status ${res.status}`);
    }

    const data = await res.json();
    const rawLyrics = data.lyrics || '';

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
    const lyrics = lyricsData.filter((l: { text: string; annotation?: string }) => l.text !== '' || l.annotation);

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
