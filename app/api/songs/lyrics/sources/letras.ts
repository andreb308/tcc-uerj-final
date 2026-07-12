import {
  USER_AGENT,
  FETCH_TIMEOUT,
  getAbortSignal,
  deburr,
  kebabCase,
  levenshtein,
  titleMatches,
  fetchHtml,
  cleanLyrics,
} from '../helpers';

interface LetrasSolrDoc {
  t: string;
  txt?: string;
  art?: string;
  dns?: string;
  url?: string;
}

/**
 * Queries the Letras Solr autocomplete service to find a matching song URL.
 *
 * @param {string} title - The song title.
 * @param {string} artistName - The artist name.
 * @param {AbortSignal} [signal] - Optional abort signal for request cancellation.
 * @returns {Promise<string>} A promise resolving to the matched Letras song page URL.
 * @throws {Error} If no match is found, or if API response is invalid/empty.
 */
async function searchLetras(title: string, artistName: string, signal?: AbortSignal): Promise<string> {
  const queryStr = `${artistName} ${title}`;
  const searchUrl = `https://solr.sscdn.co/letras/m1/?q=${encodeURIComponent(queryStr)}&wt=json`;
  
  // console.log(`[lyricSearch] Querying Letras Solr autocomplete: ${searchUrl}`);
  
  const res = await fetch(searchUrl, {
    headers: {
      'User-Agent': USER_AGENT,
    },
    signal: getAbortSignal(FETCH_TIMEOUT, signal),
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
  const docs: LetrasSolrDoc[] = data.response?.docs || [];
  
  const songs = docs.filter((doc) => doc.t === "2");
  if (songs.length === 0) {
    throw new Error('No songs found in Solr results');
  }
  
  const matchingSongs = songs.filter((song) => titleMatches(title, song.txt || ''));
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

/**
 * Retrieves lyrics from Letras.mus.br, attempting a direct URL construction first,
 * and falling back to a Solr search API query if direct access fails.
 *
 * @param {string} title - The song title.
 * @param {string} artistName - The artist name.
 * @param {AbortSignal} [signal] - Optional abort signal for request cancellation.
 * @returns {Promise<string>} A promise resolving to the song lyrics.
 */
export function fromLetras(title: string, artistName: string, signal?: AbortSignal): Promise<string> {
  const artist = kebabCase(deburr(artistName.trim()));
  const song = kebabCase(deburr(title.trim()));
  const url = 'https://www.letras.mus.br/' + artist + '/' + song + '/';
  // console.log(`[lyricSearch] Trying Letras.mus.br direct URL: ${url}`);
  return fetchHtml(
    url,
    {
      rejectRedirects: true,
    },
    signal
  )
    .then(($) => {
      const el = $('.lyric-original p, .lyric-tra p');
      if (el.length === 0) throw new Error('Not found');
      let lyrics = '';
      el.each((_, p) => {
        const $p = $(p);
        $p.find('.romanization').remove();
        $p.find('br').replaceWith('\n');
        lyrics += $p.text().trim() + '\n\n';
      });
      return cleanLyrics(lyrics.trim());
    })
    .catch((err) => {
      if (signal?.aborted) throw err;
      // console.log(`[lyricSearch] Letras.mus.br direct URL failed: ${err.message}. Trying Solr search...`);
      return searchLetras(title, artistName, signal)
        .then((resolvedUrl) =>
          fetchHtml(resolvedUrl, { rejectRedirects: true }, signal).then(($) => {
            const el = $('.lyric-original p, .lyric-tra p');
            if (el.length === 0) throw new Error('Not found');
            let lyrics = '';
            el.each((_, p) => {
              const $p = $(p);
              $p.find('.romanization').remove();
              $p.find('br').replaceWith('\n');
              lyrics += $p.text().trim() + '\n\n';
            });
            return cleanLyrics(lyrics.trim());
          })
        );
    });
}
