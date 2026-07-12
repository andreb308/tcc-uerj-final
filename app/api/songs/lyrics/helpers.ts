import * as cheerio from 'cheerio';

export const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0';

export const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
];

/**
 * Returns a random User-Agent string from the pre-defined list.
 *
 * @returns {string} A random User-Agent string.
 */
export function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export const FETCH_TIMEOUT = 5000; // 5s per source request

/**
 * Calculates the Levenshtein distance between two strings.
 *
 * @param {string} a - The first string.
 * @param {string} b - The second string.
 * @returns {number} The edit distance between the two strings.
 */
export function levenshtein(a: string, b: string): number {
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

/**
 * Normalizes a string by removing accents and diacritics.
 *
 * @param {string} str - The input string to normalize.
 * @returns {string} The normalized string.
 */
export function deburr(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Converts a string to kebab-case format.
 * Non-alphanumeric character sequences are replaced by hyphens.
 *
 * @param {string} str - The input string.
 * @returns {string} The kebab-cased string.
 */
export function kebabCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

/**
 * Converts a string to snake_case format.
 * Non-alphanumeric character sequences are replaced by underscores.
 *
 * @param {string} str - The input string.
 * @returns {string} The snake-cased string.
 */
export function snakeCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
}

/**
 * Strips all non-alphanumeric characters from a string and converts it to lowercase.
 *
 * @param {string} str - The input string.
 * @returns {string} The alphanumeric-only, lowercase string.
 */
export function stripToAlphaNum(str: string): string {
  return str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

/**
 * Check if a result title is a reasonable match for the requested title.
 * Evaluates both the full string and a version with parenthetical tags stripped,
 * safely supporting Unicode characters (like Korean Hangul).
 *
 * @param {string} requested - The requested song title.
 * @param {string} found - The song title found in search results.
 * @returns {boolean} True if the titles match within acceptable criteria, otherwise false.
 */
export function titleMatches(requested: string, found: string): boolean {
  // \p{L} keeps any unicode letter intact so non-English titles aren't erased
  const cleanStr = (s: string) =>
    deburr(s)
      .toLowerCase()
      .replace(/[^\p{L}0-9]/gu, '');
  const stripTags = (s: string) => s.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '');

  // 1. First Pass: Evaluate with parenthetical content intact
  // This solves bilingual tags like "우주로 (WOULD YOU RUN)" vs "WOULD YOU RUN"
  const aFull = cleanStr(requested);
  const bFull = cleanStr(found);

  if (aFull && bFull) {
    if (aFull === bFull || aFull.includes(bFull) || bFull.includes(aFull)) return true;
  }

  // 2. Second Pass: Evaluate with parentheses/brackets stripped
  // This solves mismatched versions like "Song (Live)" vs "Song (Acoustic)"
  const aStripped = cleanStr(stripTags(requested));
  const bStripped = cleanStr(stripTags(found));

  if (!aStripped || !bStripped) return false;

  if (aStripped === bStripped || aStripped.includes(bStripped) || bStripped.includes(aStripped))
    return true;

  // 3. Fallback: Levenshtein distance on the stripped versions
  const dist = levenshtein(aStripped, bStripped);
  const maxLen = Math.max(aStripped.length, bStripped.length);
  return dist / maxLen <= 0.3;
}

/**
 * Extracts and cleans the text content from a Cheerio selection,
 * replacing `<br>` elements with newlines and stripping remaining HTML tags.
 *
 * @param {cheerio.Cheerio<any>} $el - The Cheerio element selection.
 * @returns {string} Cleaned, newline-separated text contents of the element.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function textln($el: cheerio.Cheerio<any>): string {
  $el.find('script').remove();
  $el.find('#video-musictory').remove();
  // Get inner HTML so we can process it as a string
  let html = $el.html() || '';
  // Normalize <br> variants to \n, eating surrounding whitespace/newlines
  html = html.replace(/\s*<br\s*\/?>\s*/gi, '\n');
  // Strip all remaining HTML tags
  html = html.replace(/<[^>]+>/g, '');
  // Decode common HTML entities
  html = html.replace(/&amp;/g, '&');
  html = html.replace(/&lt;/g, '<');
  html = html.replace(/&gt;/g, '>');
  html = html.replace(/&quot;/g, '"');
  html = html.replace(/&#x27;/g, "'");
  html = html.replace(/&nbsp;/g, ' ');
  // Clean up whitespace
  html = html.replace(/\r\n/g, '\n');
  html = html.replace(/\t/g, '');
  html = html.replace(/ +/g, ' ');
  html = html.replace(/\n /g, '\n');
  html = html.replace(/ \n/g, '\n');
  return html.trim();
}

const REJECT_PATTERNS = [
  /no lyrics found/i,
  /lyrics not available/i,
  /we do not have the lyrics/i,
  /submit lyrics/i,
  /paroles introuvables/i,
  /n[ãa]o possui letra/i,
];

/**
 * Cleans the raw scraped lyrics text by removing metadata headers, boilerplate,
 * and rejecting placeholder/error messages.
 *
 * @param {string} text - The raw scraped lyrics.
 * @returns {string} The cleaned lyrics.
 * @throws {Error} If no lyrics are found or if a known error/placeholder pattern is matched.
 */
export function cleanLyrics(text: string): string {
  text = text.trim();

  // Strip Genius boilerplate like "43 ContributorsTranslations...Read More"
  // This happens when the scraper accidentally grabs the metadata header.
  const contribMatch = text.match(/^[\s\S]{0,200}?(?:\d+\s+)?Contributors/i);
  if (contribMatch) {
    const readMoreMatch = text.match(/Read More/i);
    const lyricsMatch = text.match(/Lyrics/i);

    let cutIndex = -1;
    if (readMoreMatch && readMoreMatch.index! < 1500) {
      cutIndex = readMoreMatch.index! + readMoreMatch[0].length;
    } else if (lyricsMatch && lyricsMatch.index! < 1000) {
      cutIndex = lyricsMatch.index! + lyricsMatch[0].length;
    }

    if (cutIndex !== -1) {
      text = text.substring(cutIndex).trim();
    }
  }

  // Remove lyric lines that match Genius headers with "가사" (e.g., [스트레이 키즈 "CEREMONY" 가사])
  text = text
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      // Bracketed headers containing "가사"
      if (trimmed.startsWith('[') && trimmed.endsWith(']') && trimmed.includes('가사')) {
        return false;
      }
      // Unbracketed title/artist headers containing quotes and ending/containing "가사"
      if (
        trimmed.includes('가사') &&
        trimmed.includes('"') &&
        (trimmed.endsWith('가사') || trimmed.startsWith(trimmed.split('"')[0]))
      ) {
        return false;
      }
      return true;
    })
    .join('\n');

  // Collapse 3+ consecutive newlines into 2 (one blank line)
  text = text.replace(/\n{3,}/g, '\n\n');
  // Remove trailing spaces on each line
  text = text.replace(/ +\n/g, '\n');
  if (text.length < 20) throw new Error('No lyrics found');
  // Reject placeholder/error messages scraped from source pages
  if (text.length < 80 && REJECT_PATTERNS.some((re) => re.test(text))) {
    throw new Error('Scraped error message, not lyrics');
  }
  return text;
}

/**
 * Generates an AbortSignal that aborts after a timeout, optionally chaining an existing AbortSignal.
 *
 * @param {number} timeoutMs - The timeout duration in milliseconds.
 * @param {AbortSignal} [customSignal] - An optional parent AbortSignal to chain with.
 * @returns {AbortSignal} The chained or timeout AbortSignal.
 */
export function getAbortSignal(timeoutMs: number, customSignal?: AbortSignal): AbortSignal {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error('Timeout'));
  }, timeoutMs);

  if (customSignal) {
    if (customSignal.aborted) {
      clearTimeout(timeoutId);
      controller.abort(customSignal.reason);
    } else {
      const onAbort = () => {
        clearTimeout(timeoutId);
        controller.abort(customSignal.reason);
      };
      customSignal.addEventListener('abort', onAbort);
      controller.signal.addEventListener('abort', () => {
        customSignal.removeEventListener('abort', onAbort);
      });
    }
  }
  return controller.signal;
}

export interface FetchOptions extends RequestInit {
  rejectRedirects?: boolean;
}

/**
 * Fetches a URL and returns a parsed Cheerio document.
 *
 * @param {string} url - The URL to fetch.
 * @param {FetchOptions} [options={}] - Custom fetch options.
 * @param {AbortSignal} [signal] - Optional abort signal for request cancellation.
 * @returns {Promise<cheerio.CheerioAPI>} A promise resolving to the Cheerio API wrapper loaded with the page body.
 * @throws {Error} If the HTTP request fails or a redirect occurs when rejectRedirects option is active.
 */
export async function fetchHtml(
  url: string,
  options: FetchOptions = {},
  signal?: AbortSignal
): Promise<cheerio.CheerioAPI> {
  const { rejectRedirects, ...fetchOptions } = options;
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    redirect: 'follow',
    cache: 'no-store', // Disable Next.js caching to prevent prod issues
    signal: getAbortSignal(FETCH_TIMEOUT, signal),
    ...fetchOptions,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  // Some sites redirect unknown songs to artist page or homepage
  if (rejectRedirects && res.redirected) {
    throw new Error(`Redirected from ${url} (likely no match)`);
  }
  const body = await res.text();
  return cheerio.load(body);
}
