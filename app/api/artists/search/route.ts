export interface MBArtistSearchResponse {
  created: string;
  count: number;
  offset: number;
  artists: MBArtist[];
}

export interface MBArtist {
  id: string;
  score: number;
  name: string;
  'sort-name': string;
  'life-span': MBLifeSpan;
  type?: string;
  'type-id'?: string;
  'gender-id'?: string;
  gender?: string;
  country?: string;
  area?: MBArea;
  'begin-area'?: MBArea;
  'end-area'?: MBArea;
  ipis?: string[];
  isnis?: string[];
  aliases?: MBAlias[];
  tags?: MBTag[];
  disambiguation?: string;
}

export interface MBLifeSpan {
  begin?: string;
  end?: string;
  ended: boolean | null;
}

export interface MBArea {
  id: string;
  type: string;
  'type-id': string;
  name: string;
  'sort-name': string;
  'life-span': MBLifeSpan;
}

export interface MBAlias {
  'sort-name': string;
  name: string;
  locale: string | null;
  type: string | null;
  primary: boolean | null;
  'begin-date': string | null;
  'end-date': string | null;
  'type-id'?: string;
}

export interface MBTag {
  count: number;
  name: string;
}

import { NextRequest, NextResponse } from 'next/server';

const MB_API_BASE = 'https://musicbrainz.org/ws/2';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');

  if (!query || query.trim().length < 1) {
    return NextResponse.json({ results: [] });
  }

  try {
    const searchParams = new URLSearchParams({
      query: query.trim(),
      fmt: 'json',
      limit: '10',
    });

    const res = await fetch(`${MB_API_BASE}/artist/?${searchParams}`, {
      headers: {
        'User-Agent': 'User-Agent/1.0 (user@agent.dev)',
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`MusicBrainz API responded with ${res.status}`);
    }

    const data: MBArtistSearchResponse = await res.json();

    // Use a Set to filter out duplicate artists with the exact same spelling (case-insensitive)
    const seen = new Set<string>();

    const results = (data.artists ?? [])
      .filter((artist) => {
        const key = artist.name.toLowerCase();

        if (seen.has(key)) return false;

        seen.add(key);
        return true;
      })
      .map(({ id, name }) => ({ id, name }))
      .slice(0, 5);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('MusicBrainz artist search error:', error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
