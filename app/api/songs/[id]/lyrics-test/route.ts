import * as cheerio from 'cheerio';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

function levenshtein(a: string, b: string): number {
  const m = a.length,
    n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function deburr(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function kebabCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function titleMatches(requested: string, found: string): boolean {
  const cleanStr = (s: string) =>
    deburr(s)
      .toLowerCase()
      .replace(/[^\p{L}0-9]/gu, '');
  const stripTags = (s: string) => s.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '');

  const aFull = cleanStr(requested);
  const bFull = cleanStr(found);

  if (aFull && bFull) {
    if (aFull === bFull || aFull.includes(bFull) || bFull.includes(aFull)) return true;
  }

  const aStripped = cleanStr(stripTags(requested));
  const bStripped = cleanStr(stripTags(found));

  if (!aStripped || !bStripped) return false;

  if (aStripped === bStripped || aStripped.includes(bStripped) || bStripped.includes(aStripped))
    return true;

  const dist = levenshtein(aStripped, bStripped);
  const maxLen = Math.max(aStripped.length, bStripped.length);
  return dist / maxLen <= 0.3;
}

const REJECT_PATTERNS = [
  /no lyrics found/i,
  /lyrics not available/i,
  /we do not have the lyrics/i,
  /submit lyrics/i,
  /paroles introuvables/i,
  /n[ãa]o possui letra/i,
];

function cleanLyrics(text: string): string {
  text = text.trim();
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/ +\n/g, '\n');
  if (text.length < 20) throw new Error('No lyrics found');
  if (text.length < 80 && REJECT_PATTERNS.some((re) => re.test(text))) {
    throw new Error('Scraped error message, not lyrics');
  }
  return text;
}

async function fetchHtml(url: string, signal?: AbortSignal): Promise<cheerio.CheerioAPI> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
    },
    signal,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${url}`);
  }
  const html = await res.text();
  return cheerio.load(html);
}

async function searchLetras(title: string, artistName: string, signal?: AbortSignal): Promise<string> {
  const queryStr = `${artistName} ${title}`;
  const searchUrl = `https://solr.sscdn.co/letras/m1/?q=${encodeURIComponent(queryStr)}&wt=json`;
  
  console.log(`[lyricSearch-test] Querying Solr autocomplete: ${searchUrl}`);
  
  const res = await fetch(searchUrl, {
    headers: {
      'User-Agent': USER_AGENT,
    },
    signal,
  });
  
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from Solr`);
  }
  
  const text = await res.text();
  const jsonStart = text.indexOf('({');
  const jsonEnd = text.lastIndexOf('})');
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('Invalid JSONP response from Solr');
  }
  
  const jsonStr = text.substring(jsonStart + 1, jsonEnd + 1);
  const data = JSON.parse(jsonStr);
  const docs = data.response?.docs || [];
  
  const songs = docs.filter((doc: any) => doc.t === "2");
  if (songs.length === 0) {
    throw new Error('No songs found in Solr results');
  }
  
  const matchingSongs = songs.filter((song: any) => titleMatches(title, song.txt || ''));
  if (matchingSongs.length === 0) {
    throw new Error('No title match found in Solr results');
  }
  
  let bestSong = matchingSongs[0];
  let bestScore = Infinity;
  for (const song of matchingSongs) {
    const score = levenshtein(artistName.toLowerCase(), (song.art || '').toLowerCase());
    if (score < bestScore) {
      bestScore = score;
      bestSong = song;
    }
  }
  
  if (!bestSong.dns || !bestSong.url) {
    throw new Error('Best match lacks URL details in Solr');
  }
  
  return `https://www.letras.mus.br/${bestSong.dns}/${bestSong.url}/`;
}

async function scrapeLetras(url: string, signal?: AbortSignal): Promise<string> {
  console.log(`[lyricSearch-test] Scraped Letras URL: ${url}`);
  const $ = await fetchHtml(url, signal);
  const el = $('.lyric-original p, .lyric-tra p');
  if (el.length === 0) throw new Error('Lyrics paragraphs not found on page');
  
  let lyrics = '';
  el.each((_, p) => {
    const $p = $(p);
    $p.find('.romanization').remove();
    $p.find('br').replaceWith('\n');
    lyrics += $p.text().trim() + '\n\n';
  });
  
  return cleanLyrics(lyrics.trim());
}

export async function findLyrics(title: string, artistName: string, signal?: AbortSignal): Promise<string> {
  const artistSlug = kebabCase(deburr(artistName.trim()));
  const songSlug = kebabCase(deburr(title.trim()));
  const directUrl = `https://www.letras.mus.br/${artistSlug}/${songSlug}/`;
  
  console.log(`[lyricSearch-test] Trying Letras.mus.br direct URL first: ${directUrl}`);
  try {
    return await scrapeLetras(directUrl, signal);
  } catch (err: any) {
    if (signal?.aborted) throw err;
    console.log(`[lyricSearch-test] Direct URL failed: ${err.message}. Trying Solr search...`);
    const resolvedUrl = await searchLetras(title, artistName, signal);
    return await scrapeLetras(resolvedUrl, signal);
  }
}

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

    const lyrics = lyricsData.filter(
      (l: { text: string; annotation?: string }) => l.text !== '' || l.annotation
    );

    return NextResponse.json({
      lyrics,
      title,
      artist,
      fullTitle: `${artist} - ${title}`,
    });
  } catch (error: any) {
    console.error('Failed to fetch lyrics:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch lyrics',
        message: error?.message || String(error),
        stack: error?.stack,
      },
      { status: 500 }
    );
  }
}
