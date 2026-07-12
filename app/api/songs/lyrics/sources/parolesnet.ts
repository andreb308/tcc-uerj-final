import {
  deburr,
  kebabCase,
  fetchHtml,
  textln,
  cleanLyrics,
} from '../helpers';

/**
 * Retrieves lyrics from Paroles.net using direct URL construction.
 *
 * @param {string} title - The song title.
 * @param {string} artistName - The artist name.
 * @param {AbortSignal} [signal] - Optional abort signal for request cancellation.
 * @returns {Promise<string>} A promise resolving to the song lyrics.
 */
export function fromParolesNet(title: string, artistName: string, signal?: AbortSignal): Promise<string> {
  const lyricsUrl = (s: string) => kebabCase(deburr(s.trim().toLowerCase()));
  const url = 'https://www.paroles.net/' + lyricsUrl(artistName) + '/paroles-' + lyricsUrl(title);
  // console.log(`[lyricSearch] Trying Paroles.net direct URL: ${url}`);
  return fetchHtml(url, { rejectRedirects: true }, signal).then(($) => {
    let el = $('.lyrics');
    if (el.length === 0) el = $('.song-text');
    if (el.length === 0) throw new Error('Not found');
    // Remove header and ad divs that are mixed into lyrics
    el.find('h2').remove();
    el.find('div[id], div[class]').remove();
    return cleanLyrics(textln(el));
  });
}
