import { deburr, stripToAlphaNum, fetchHtml, cleanLyrics, getRandomUserAgent } from '../helpers';

/**
 * Retrieves lyrics from AZLyrics using direct URL construction.
 *
 * @param {string} title - The song title.
 * @param {string} artistName - The artist name.
 * @param {AbortSignal} [signal] - Optional abort signal for request cancellation.
 * @returns {Promise<string>} A promise resolving to the song lyrics.
 */
export function fromAZLyrics(
  title: string,
  artistName: string,
  signal?: AbortSignal
): Promise<string> {
  const artist = stripToAlphaNum(deburr(artistName)).replace(/^the/, '');
  const song = stripToAlphaNum(deburr(title));
  const url = 'https://www.azlyrics.com/lyrics/' + artist + '/' + song + '.html';
  // console.log(`[lyricSearch] Trying AZLyrics direct URL: ${url}`);
  return fetchHtml(url, { headers: { 'User-Agent': getRandomUserAgent() } }, signal).then(($) => {
    if (
      $('.alert').text().includes('unusual activity') ||
      $('body').text().includes('unusual activity')
    ) {
      throw new Error('Blocked by AZLyrics bot detection / CAPTCHA');
    }
    // Lyrics are in an unnamed div after the .ringtone div
    let divs = $('.col-xs-12.col-lg-8.text-center div');
    if (divs.length === 0) divs = $('.main-page div');
    let lyrics = '';
    divs.each((_, el) => {
      const $el = $(el);
      // The lyrics div has no class and no id
      if (!$el.attr('class') && !$el.attr('id') && $el.text().trim().length > 100) {
        $el.find('br').replaceWith('\n');
        lyrics = $el.text().trim();
        return false; // break
      }
    });
    try {
      return cleanLyrics(lyrics);
    } catch (err) {
      // console.log(
      //   `[lyricSearch] AZLyrics failed to find lyrics for ${url}. HTML Dump:\n`,
      //   $.html()
      // );
      throw err;
    }
  });
}
