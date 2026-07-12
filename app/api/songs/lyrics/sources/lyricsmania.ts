import { deburr, snakeCase, fetchHtml, textln, cleanLyrics } from '../helpers';

/**
 * Retrieves lyrics from LyricsMania using multiple direct URL pattern options.
 *
 * @param {string} title - The song title.
 * @param {string} artistName - The artist name.
 * @param {AbortSignal} [signal] - Optional abort signal for request cancellation.
 * @returns {Promise<string>} A promise resolving to the song lyrics.
 */
export function fromLyricsMania(
  title: string,
  artistName: string,
  signal?: AbortSignal
): Promise<string> {
  const maniaUrl = (s: string) => snakeCase(deburr(s.trim().toLowerCase()));
  const urls = [
    'https://www.lyricsmania.com/' + maniaUrl(title) + '_lyrics_' + maniaUrl(artistName) + '.html',
    'https://www.lyricsmania.com/' + maniaUrl(title) + '_' + maniaUrl(artistName) + '.html',
  ];
  return Promise.any(
    urls.map((url) => {
      // console.log(`[lyricSearch] Trying LyricsMania direct URL: ${url}`);
      return fetchHtml(url, { rejectRedirects: true }, signal).then(($) => {
        if ($('.lyrics-body').length === 0) throw new Error('Not found');
        return cleanLyrics(textln($('.lyrics-body')));
      });
    })
  );
}
