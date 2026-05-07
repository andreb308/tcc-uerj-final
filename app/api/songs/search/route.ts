import { NextRequest, NextResponse } from 'next/server';

const GENIUS_API_BASE = 'https://api.genius.com';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  const artist = request.nextUrl.searchParams.get('artist')?.trim().toLowerCase() ?? '';

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  const token = process.env.GENIUS_CLIENT_ACCESS_TOKEN;
  if (!token) {
    console.error('Missing GENIUS_CLIENT_ACCESS_TOKEN env variable');
    return NextResponse.json({ results: [] }, { status: 500 });
  }

  try {
    const searchParams = new URLSearchParams({ q: `${artist} - ${q.trim()}`, per_page: '10' });
    const res = await fetch(`${GENIUS_API_BASE}/search?${searchParams}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error(`Genius API responded with ${res.status}`);
    }

    const data = await res.json();
    const hits = data?.response?.hits ?? [];

    let results = hits.map(
      (hit: {
        result: { id: number; title: string; full_title: string; primary_artist: { name: string } };
      }) => ({
        id: hit.result.id,
        title: hit.result.title,
        artist: hit.result.primary_artist?.name ?? '',
        fullTitle: hit.result.full_title,
      })
    );

    if (artist) {
      results = results.filter((song: { artist: string }) =>
        song.artist.toLowerCase().includes(artist)
      );
    }

    results = results.slice(0, 5);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Genius song search error:', error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
