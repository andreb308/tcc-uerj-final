import {
  USER_AGENT,
  FETCH_TIMEOUT,
  getAbortSignal,
  cleanLyrics,
} from '../helpers';

/**
 * Retrieves lyrics from the lyrics.ovh API.
 *
 * @param {string} title - The song title.
 * @param {string} artistName - The artist name.
 * @param {AbortSignal} [signal] - Optional abort signal for request cancellation.
 * @returns {Promise<string>} A promise resolving to the song lyrics.
 */
export function fromOvh(title: string, artistName: string, signal?: AbortSignal): Promise<string> {
  const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artistName)}/${encodeURIComponent(title)}`;
  // console.log(`[lyricSearch] Trying lyrics.ovh API URL: ${url}`);
  return fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    cache: 'no-store',
    signal: getAbortSignal(FETCH_TIMEOUT, signal),
  })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status} from lyrics.ovh`);
      return res.json();
    })
    .then((data) => {
      if (!data.lyrics) throw new Error('No lyrics in response');
      return cleanLyrics(data.lyrics);
    });
}
