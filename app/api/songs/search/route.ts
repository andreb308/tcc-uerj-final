import { NextRequest, NextResponse } from 'next/server';

export interface OvhSearchResponse {
  data: OvhTrack[];
  total: number;
  next?: string;
  prev?: string; 
}

export interface OvhTrack {
  id: number;
  readable: boolean;
  title: string;
  title_short: string;
  title_version: string;
  isrc: string;
  link: string;
  duration: number;
  rank: number;
  explicit_lyrics: boolean;
  explicit_content_lyrics: number;
  explicit_content_cover: number;
  preview: string;
  md5_image: string;
  artist: OvhArtist;
  album: OvhAlbum;
  type: string; 
}

export interface OvhArtist {
  id: number;
  name: string;
  link: string;
  picture: string;
  picture_small: string;
  picture_medium: string;
  picture_big: string;
  picture_xl: string;
  tracklist: string;
  type: string; 
}

export interface OvhAlbum {
  id: number;
  title: string;
  cover: string;
  cover_small: string;
  cover_medium: string;
  cover_big: string;
  cover_xl: string;
  md5_image: string;
  tracklist: string;
  type: string; 
}

const OVH_API_BASE = 'https://api.lyrics.ovh/suggest';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? '';
  const artist = request.nextUrl.searchParams.get('artist')?.trim().toLowerCase() ?? '';

  if (!q.trim() && !artist.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Build the query: prepend artist if provided for better relevance
    const query = artist ? `${artist} ${q.trim()}` : q.trim();
    const res = await fetch(`${OVH_API_BASE}/${encodeURIComponent(query)}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`lyrics.ovh API responded with ${res.status}`);
    }

    const data: OvhSearchResponse = await res.json();
    const tracks = data.data ?? [];

    const results = tracks.slice(0, 5).map((track: OvhTrack) => ({
      id: track.id,
      title: track.title,
      artist: track.artist.name,
      fullTitle: `${track.title} by ${track.artist.name}`,
      albumCover: track.album ? {
        small: track.album.cover_small,
        medium: track.album.cover_medium,
        big: track.album.cover_big,
        xl: track.album.cover_xl,
      } : null,
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('lyrics.ovh song search error:', error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
