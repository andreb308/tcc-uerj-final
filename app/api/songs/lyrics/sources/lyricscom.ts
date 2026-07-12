import { levenshtein, titleMatches, fetchHtml, cleanLyrics } from '../helpers';

/**
 * Retrieves lyrics from Lyrics.com by performing a search and scraping the best match.
 *
 * @param {string} title - The song title.
 * @param {string} artistName - The artist name.
 * @param {AbortSignal} [signal] - Optional abort signal for request cancellation.
 * @returns {Promise<string>} A promise resolving to the song lyrics.
 */
export function fromLyricsCom(
  title: string,
  artistName: string,
  signal?: AbortSignal
): Promise<string> {
  const searchUrl = 'https://www.lyrics.com/serp.php?st=' + encodeURIComponent(title) + '&stype=1';
  // console.log(`[lyricSearch] Trying Lyrics.com search URL: ${searchUrl}`);
  return fetchHtml(searchUrl, {}, signal)
    .then(($) => {
      const results = $('.sec-lyric.clearfix');
      if (results.length === 0) throw new Error('No results');
      // Find the closest match by artist name
      let bestLink: string | null = null;
      let bestScore = Infinity;
      results.each((_, el) => {
        const $el = $(el);
        const artist = $el.find('.lyric-meta-album-artist a').first().text();
        const resultTitle = $el.find('a.lyric-meta-title').text();
        const link = $el.find('a.lyric-meta-title').attr('href');
        // Only consider results where the title actually matches
        if (link && titleMatches(title, resultTitle)) {
          const score = levenshtein(artistName.toLowerCase(), artist.toLowerCase());
          if (score < bestScore) {
            bestScore = score;
            bestLink = link;
          }
        }
      });
      if (!bestLink) throw new Error('No matching result');
      const url = (bestLink as string).startsWith('http')
        ? (bestLink as string)
        : 'https://www.lyrics.com' + bestLink;
      // console.log(`[lyricSearch] Trying Lyrics.com match URL: ${url}`);
      return fetchHtml(url, {}, signal);
    })
    .then(($) => {
      const el = $('#lyric-body-text');
      if (el.length === 0) throw new Error('Not found');
      el.find('br').replaceWith('\n');
      return cleanLyrics(el.text().trim());
    });
}
