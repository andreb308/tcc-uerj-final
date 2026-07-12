import * as cheerio from 'cheerio';
import {
  USER_AGENT,
  FETCH_TIMEOUT,
  getAbortSignal,
  levenshtein,
  titleMatches,
  cleanLyrics,
  fetchHtml,
} from '../helpers';

/**
 * Guesses the Genius URL for a song based on the title and artist name.
 *
 * @param {string} title - The song title.
 * @param {string} artistName - The artist name.
 * @returns {string} The guessed Genius song URL.
 */
function guessGeniusUrl(title: string, artistName: string): string {
  const extractEnglish = (s: string) => {
    const match = s.match(/\(([a-zA-Z0-9\s]+)\)/);
    if (match) return match[1];
    return s.replace(/[^\w\s-]/g, '');
  };

  const cleanArtist = extractEnglish(artistName).trim();
  const cleanTitle = extractEnglish(title).trim();
  const combined = `${cleanArtist}-${cleanTitle}-lyrics`;
  let slug = combined
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .replace(/-+/g, '-')
    .toLowerCase();

  if (slug.length > 0) {
    slug = slug.charAt(0).toUpperCase() + slug.slice(1);
  }

  return `https://genius.com/${slug}`;
}

/**
 * Parses the Genius lyrics page to extract lyrics text.
 *
 * @param {cheerio.CheerioAPI} $ - Loaded Cheerio instance of the Genius page.
 * @returns {string} The cleaned lyrics text.
 * @throws {Error} If no lyrics container is found.
 */
function parseGeniusPage($: cheerio.CheerioAPI): string {
  const containers = $('[data-lyrics-container="true"]');
  if (containers.length === 0) throw new Error('No lyrics container');
  // Process each container: replace <br> with newlines, strip tags
  let lyrics = '';
  containers.each((_, el) => {
    const $el = $(el);
    $el.find('br').replaceWith('\n');
    lyrics += $el.text() + '\n';
  });
  return cleanLyrics(lyrics.trim());
}

interface GeniusApiHit {
  result: {
    title?: string;
    primary_artist?: {
      name?: string;
    };
    url: string;
  };
}

interface GeniusApiSongSection {
  type: string;
  hits?: GeniusApiHit[];
}

/**
 * Retrieves lyrics from Genius by guessing the direct URL first,
 * and falling back to searching via the Genius API if needed.
 *
 * @param {string} title - The song title.
 * @param {string} artistName - The artist name.
 * @param {AbortSignal} [signal] - Optional abort signal for request cancellation.
 * @returns {Promise<string>} A promise resolving to the song lyrics.
 */
export function fromGenius(title: string, artistName: string, signal?: AbortSignal): Promise<string> {
  const directUrl = guessGeniusUrl(title, artistName);
  // console.log(`[lyricSearch] Trying Genius direct URL: ${directUrl}`);

  return fetchHtml(directUrl, { rejectRedirects: false }, signal)
    .then(($) => parseGeniusPage($))
    .catch((err) => {
      // If the engine has been aborted, do not fall back to the API search
      if (signal?.aborted) throw err;

      // Fallback to API search
      const apiUrl =
        'https://genius.com/api/search/multi?q=' + encodeURIComponent(artistName + ' ' + title);
      // console.log(`[lyricSearch] Trying Genius API search: ${apiUrl}`);
      return fetch(apiUrl, {
        headers: { 'User-Agent': USER_AGENT },
        cache: 'no-store',
        signal: getAbortSignal(FETCH_TIMEOUT, signal),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status} from Genius API`);
          return res.json();
        })
        .then((data) => {
          const sections: GeniusApiSongSection[] = data.response?.sections || [];
          const songSection = sections.find((s) => s.type === 'song');
          const hits = songSection?.hits || [];
          if (hits.length === 0) throw new Error('No results');
          // Pick the best match by comparing artist name
          const matchingHits = hits.filter((hit) =>
            titleMatches(title, hit.result?.title || '')
          );
          if (matchingHits.length === 0) throw new Error('No matching title');
          let bestHit = matchingHits[0];
          let bestScore = Infinity;
          for (const hit of matchingHits) {
            const score = levenshtein(
              artistName.toLowerCase(),
              (hit.result?.primary_artist?.name || '').toLowerCase()
            );
            if (score < bestScore) {
              bestScore = score;
              bestHit = hit;
            }
          }
          // console.log(`[lyricSearch] Trying Genius API fallback result URL: ${bestHit.result.url}`);
          return bestHit.result.url;
        })
        .then((url) => fetchHtml(url, {}, signal))
        .then(($) => parseGeniusPage($));
    });
}
