import { NextRequest, NextResponse } from 'next/server';
import { fromGenius } from './sources/genius';
import { fromOvh } from './sources/ovh';
import { fromAZLyrics } from './sources/azlyrics';
import { fromParolesNet } from './sources/parolesnet';
import { fromLyricsMania } from './sources/lyricsmania';
import { fromLetras } from './sources/letras';
import { fromLyricsCom } from './sources/lyricscom';

// ── LRU Cache ────────────────────────────────────────────────

const CACHE_MAX = 10000;
const cache = new Map<string, string>();

/**
 * Retrieves a value from the LRU cache and updates its recency.
 *
 * @param {string} key - The cache key.
 * @returns {string | undefined} The cached lyrics, or undefined if not found.
 */
function cacheGet(key: string): string | undefined {
  const val = cache.get(key);
  if (val === undefined) return undefined;
  // Move to end (most recently used)
  cache.delete(key);
  cache.set(key, val);
  return val;
}

/**
 * Stores a value in the LRU cache, evicting the oldest entry if size exceeds cache limit.
 *
 * @param {string} key - The cache key.
 * @param {string} val - The lyrics string to cache.
 */
function cacheSet(key: string, val: string): void {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, val);
  // Evict oldest entries if over limit
  while (cache.size > CACHE_MAX) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
}

// ── Valid Providers List ─────────────────────────────────────

const VALID_PROVIDERS = [
  'genius',
  'ovh',
  'azlyrics',
  'parolesnet',
  'lyricsmania',
  'letras',
  // 'lyricscom',
];

// ── Coordination Logic ───────────────────────────────────────

/**
 * Find lyrics for a song by querying multiple sources in parallel.
 * Returns the first successful result.
 *
 * @param {string} title - The song title.
 * @param {string} artistName - The artist name.
 * @param {string[]} [allowedProviders] - Optional list of allowed provider identifiers.
 * @returns {Promise<string>} A promise resolving to the song lyrics.
 */
export function findLyrics(
  title: string,
  artistName: string,
  allowedProviders?: string[]
): Promise<string> {
  // Append active allowedProviders to the cache key so that restricted searches
  // (e.g. only letras) are cached independently from unrestricted/general searches.
  const key =
    artistName.toLowerCase() +
    '\n' +
    title.toLowerCase() +
    (allowedProviders ? `\nproviders:${allowedProviders.join(',')}` : '');
  const cached = cacheGet(key);
  if (cached) return Promise.resolve(cached);

  const controller = new AbortController();
  const { signal } = controller;

  const logError = (source: string, err: unknown) => {
    const errMsg = err instanceof Error ? err.message : String(err);
    if (!signal?.aborted && errMsg !== 'Aborted' && errMsg !== 'Aborted before start') {
      console.warn(`[/lyrics] ${source} failed:`, errMsg);
    }
    throw err;
  };

  /**
   * Helper to check if a specific provider is enabled under the allowedProviders list.
   * If allowedProviders is undefined, all providers are enabled by default.
   */
  const isEnabled = (provider: string): boolean => {
    if (!allowedProviders) return true;
    return allowedProviders.includes(provider.toLowerCase());
  };

  const promises = [];

  if (isEnabled('genius')) {
    promises.push(
      fromGenius(title, artistName, signal).then((l) => ({ source: 'Genius', lyrics: l }))
      // .catch((err) => logError('Genius', err))
    );
  }

  if (isEnabled('ovh')) {
    promises.push(
      new Promise<{ source: string; lyrics: string }>((resolve, reject) => {
        if (signal?.aborted) {
          return reject(new Error('Aborted before start'));
        }

        let timeoutId: NodeJS.Timeout | undefined = undefined;

        const onAbort = () => {
          if (timeoutId) clearTimeout(timeoutId);
          reject(new Error('Aborted'));
        };

        signal?.addEventListener('abort', onAbort);

        timeoutId = setTimeout(() => {
          if (signal?.aborted) {
            signal.removeEventListener('abort', onAbort);
            return reject(new Error('Aborted before start'));
          }
          fromOvh(title, artistName, signal)
            .then((l) => {
              signal.removeEventListener('abort', onAbort);
              resolve({ source: 'lyrics.ovh', lyrics: l });
            })
            .catch((err) => {
              signal.removeEventListener('abort', onAbort);
              reject(err);
            });
        }, 2000);
      })
      // .catch((err) => logError('lyrics.ovh', err))
    );
  }

  if (isEnabled('azlyrics')) {
    promises.push(
      fromAZLyrics(title, artistName, signal).then((l) => ({ source: 'AZLyrics', lyrics: l }))
      // .catch((err) => logError('AZLyrics', err))
    );
  }

  if (isEnabled('parolesnet')) {
    promises.push(
      fromParolesNet(title, artistName, signal).then((l) => ({ source: 'Paroles.net', lyrics: l }))
      // .catch((err) => logError('Paroles.net', err))
    );
  }

  if (isEnabled('lyricsmania')) {
    promises.push(
      fromLyricsMania(title, artistName, signal).then((l) => ({ source: 'LyricsMania', lyrics: l }))
      // .catch((err) => logError('LyricsMania', err))
    );
  }

  if (isEnabled('letras')) {
    promises.push(
      fromLetras(title, artistName, signal).then((l) => ({ source: 'Letras', lyrics: l }))
      // .catch((err) => logError('Letras', err))
    );
  }

  // if (isEnabled('lyricscom')) {
  //   promises.push(
  //     fromLyricsCom(title, artistName, signal).then((l) => ({ source: 'Lyrics.com', lyrics: l }))
  //   );
  // }

  // If no providers are matched / enabled, reject immediately
  if (promises.length === 0) {
    return Promise.reject(new Error('No valid providers enabled'));
  }

  // If title has parentheses/brackets, also try without them
  if (/\(.*\)/.test(title) || /\[.*\]/.test(title)) {
    const cleanTitle = title
      .replace(/\(.*\)/g, '')
      .replace(/\[.*\]/g, '')
      .trim();
    promises.push(
      findLyrics(cleanTitle, artistName, allowedProviders).then((l) => ({
        source: 'Fallback (Clean Title)',
        lyrics: l,
      }))
    );
  }

  // If artist contains separators (feat., &, /), try with just the primary artist
  const primaryArtist = artistName.split(/\s*(?:feat\.?|ft\.?|featuring|&|\/|,|;)\s*/i)[0].trim();
  if (primaryArtist && primaryArtist.length > 1 && primaryArtist !== artistName) {
    promises.push(
      findLyrics(title, primaryArtist, allowedProviders).then((l) => ({
        source: 'Fallback (Primary Artist)',
        lyrics: l,
      }))
    );
  }

  return Promise.any(promises)
    .then(({ source, lyrics }) => {
      controller.abort();
      console.log(
        `[SUCCESS] Selected lyrics from source: ${source} for "${title}" - "${artistName}"`
      );
      cacheSet(key, lyrics);
      return lyrics;
    })
    .catch((err) => {
      controller.abort(); // Clean up on overall failure too
      throw err;
    });
}

// ── GET Route Handler ────────────────────────────────────────

/**
 * GET route handler to retrieve structured lyrics for a given song.
 *
 * @param {NextRequest} request - The incoming Next.js request containing the artist and title query parameters.
 * @returns {Promise<NextResponse>} JSON response containing the parsed and annotated lyrics, or an error response.
 */
export async function GET(request: NextRequest) {
  const artist = request.nextUrl.searchParams.get('artist');
  const title = request.nextUrl.searchParams.get('title');

  if (!artist || !title) {
    return NextResponse.json({ error: 'Missing artist or title parameters' }, { status: 400 });
  }

  // Parse the "?providers=" query parameter to selectively query specific sources
  const providersParam = request.nextUrl.searchParams.get('providers');
  let allowedProviders: string[] | undefined = undefined;
  if (providersParam) {
    // Split input values, normalize to lowercase and trim spaces
    allowedProviders = providersParam.split(',').map((p) => p.trim().toLowerCase());

    // Check if the user specified any completely invalid provider names
    const invalidProviders = allowedProviders.filter((p) => !VALID_PROVIDERS.includes(p));

    // If ALL requested providers are invalid, return a 400 Bad Request to help developers fix typos
    if (invalidProviders.length > 0 && invalidProviders.length === allowedProviders.length) {
      return NextResponse.json(
        {
          error: `Invalid provider(s): ${invalidProviders.join(', ')}. Supported providers are: ${VALID_PROVIDERS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Filter out unrecognized providers, keeping only the valid ones for query execution
    allowedProviders = allowedProviders.filter((p) => VALID_PROVIDERS.includes(p));
  }

  try {
    const rawLyrics: string = await findLyrics(title, artist, allowedProviders);

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
