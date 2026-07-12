import * as cheerio from 'cheerio';
import type { Browser } from 'puppeteer-core';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

async function launchBrowser(): Promise<Browser> {
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL;
  console.log(`[lyricSearch] launchBrowser requested. Env: NODE_ENV=${process.env.NODE_ENV}, VERCEL=${process.env.VERCEL}. Target: ${isProd ? 'Production/Serverless' : 'Local/Dev'}`);

  if (isProd) {
    try {
      console.log('[lyricSearch] Importing @sparticuz/chromium...');
      const chromium = (await import('@sparticuz/chromium')).default;
      console.log('[lyricSearch] Importing puppeteer-core...');
      const puppeteerCore = (await import('puppeteer-core')).default;

      console.log('[lyricSearch] Resolving executablePath...');
      const execPath = await chromium.executablePath();
      console.log(`[lyricSearch] Resolved executablePath to: ${execPath}`);
      console.log(`[lyricSearch] Chromium arguments: ${JSON.stringify(chromium.args)}`);

      console.log('[lyricSearch] Launching puppeteer-core...');
      const browser = await puppeteerCore.launch({
        args: [...chromium.args, '--disable-blink-features=AutomationControlled'],
        executablePath: execPath,
        headless: true,
      });
      console.log('[lyricSearch] Puppeteer-core browser launched successfully.');
      return browser as unknown as Browser;
    } catch (err: any) {
      console.error('[lyricSearch] Failed to launch browser in production mode:', err);
      throw err;
    }
  } else {
    try {
      console.log('[lyricSearch] Importing local puppeteer...');
      const puppeteerLocal = (await import('puppeteer')).default;
      console.log('[lyricSearch] Launching local puppeteer...');
      const browser = await puppeteerLocal.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
        ],
      });
      console.log('[lyricSearch] Local puppeteer browser launched successfully.');
      return browser as unknown as Browser;
    } catch (err: any) {
      console.error('[lyricSearch] Failed to launch local browser:', err);
      throw err;
    }
  }
}

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const FETCH_TIMEOUT = 10000; // 10s per source request

// ── LRU Cache ────────────────────────────────────────────────

const CACHE_MAX = 10000;
const cache = new Map<string, string>();

function cacheGet(key: string): string | undefined {
  const val = cache.get(key);
  if (val === undefined) return undefined;
  // Move to end (most recently used)
  cache.delete(key);
  cache.set(key, val);
  return val;
}

function cacheSet(key: string, val: string): void {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, val);
  // Evict oldest entries if over limit
  while (cache.size > CACHE_MAX) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
}

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

function snakeCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
}

function stripToAlphaNum(str: string): string {
  return str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

/**
 * Check if a result title is a reasonable match for the requested title.
 * Evaluates both the full string and a version with parenthetical tags stripped,
 * safely supporting Unicode characters (like Korean Hangul).
 */
function titleMatches(requested: string, found: string): boolean {
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

function textln($el: cheerio.Cheerio<any>): string {
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

function cleanLyrics(text: string): string {
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
      if (trimmed.includes('가사') && trimmed.includes('"') && (trimmed.endsWith('가사') || trimmed.startsWith(trimmed.split('"')[0]))) {
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

function getAbortSignal(timeoutMs: number, customSignal?: AbortSignal): AbortSignal {
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

interface FetchOptions extends RequestInit {
  rejectRedirects?: boolean;
}

async function fetchHtml(
  url: string,
  options: FetchOptions = {},
  browser?: Browser,
  signal?: AbortSignal
): Promise<cheerio.CheerioAPI> {
  if (!browser) {
    const tmpBrowser = await launchBrowser();
    try {
      return await fetchHtml(url, options, tmpBrowser, signal);
    } finally {
      await tmpBrowser.close().catch(() => {});
    }
  }

  const { rejectRedirects } = options;
  const page = await browser.newPage();

  // Set user agent
  await page.setUserAgent(USER_AGENT);

  // Set up abort handling
  let abortHandler: (() => void) | undefined;
  if (signal) {
    if (signal.aborted) {
      await page.close().catch(() => {});
      throw new Error('Aborted');
    }
    abortHandler = () => {
      page.close().catch(() => {});
    };
    signal.addEventListener('abort', abortHandler);
  }

  try {
    console.log(`[lyricSearch] fetchHtml: Navigating to URL: ${url}`);
    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: FETCH_TIMEOUT,
    });

    if (!response) {
      throw new Error(`Failed to load ${url} (no response)`);
    }

    console.log(`[lyricSearch] fetchHtml: Completed loading URL: ${url} (status: ${response.status()})`);

    if (!response.ok()) {
      throw new Error(`HTTP ${response.status()} from ${url}`);
    }

    if (rejectRedirects && response.request().redirectChain().length > 0) {
      throw new Error(`Redirected from ${url} (likely no match)`);
    }

    const content = await page.content();
    return cheerio.load(content);
  } finally {
    if (signal && abortHandler) {
      signal.removeEventListener('abort', abortHandler);
    }
    await page.close().catch(() => {});
  }
}

// ── Sources ──────────────────────────────────────────────────

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

/**
 * Genius - largest lyrics database
 * Tries guessing the URL directly first to save API calls, then falls back to search API
 */
function fromGenius(title: string, artistName: string, browser?: Browser, signal?: AbortSignal): Promise<string> {
  const directUrl = guessGeniusUrl(title, artistName);
  console.log(`[lyricSearch] Trying Genius direct URL: ${directUrl}`);

  return fetchHtml(directUrl, { rejectRedirects: false }, browser, signal)
    .then(($) => parseGeniusPage($))
    .catch((err) => {
      // If the engine has been aborted, do not fall back to the API search
      if (signal?.aborted) throw err;

      // Fallback to API search
      const apiUrl =
        'https://genius.com/api/search/multi?q=' + encodeURIComponent(artistName + ' ' + title);
      console.log(`[lyricSearch] Trying Genius API search: ${apiUrl}`);
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
          const sections = data.response?.sections || [];
          const songSection = sections.find((s: any) => s.type === 'song');
          const hits = songSection?.hits || [];
          if (hits.length === 0) throw new Error('No results');
          // Pick the best match by comparing artist name
          const matchingHits = hits.filter((hit: any) =>
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
          console.log(`[lyricSearch] Trying Genius API fallback result URL: ${bestHit.result.url}`);
          return bestHit.result.url;
        })
        .then((url) => fetchHtml(url, {}, browser, signal))
        .then(($) => parseGeniusPage($));
    });
}

/**
 * AZLyrics - good English song coverage
 * Direct URL construction
 */
function fromAZLyrics(title: string, artistName: string, browser?: Browser, signal?: AbortSignal): Promise<string> {
  const artist = stripToAlphaNum(deburr(artistName)).replace(/^the/, '');
  const song = stripToAlphaNum(deburr(title));
  const url = 'https://www.azlyrics.com/lyrics/' + artist + '/' + song + '.html';
  console.log(`[lyricSearch] Trying AZLyrics direct URL: ${url}`);
  return fetchHtml(url, {}, browser, signal).then(($) => {
    // Lyrics are in an unnamed div after the .ringtone div
    const divs = $('.col-xs-12.col-lg-8.text-center div');
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
    return cleanLyrics(lyrics);
  });
}

/**
 * Letras.mus.br - excellent international coverage
 */
function fromLetras(title: string, artistName: string, browser?: Browser, signal?: AbortSignal): Promise<string> {
  const artist = kebabCase(deburr(artistName.trim()));
  const song = kebabCase(deburr(title.trim()));
  const url = 'https://www.letras.mus.br/' + artist + '/' + song + '/';
  console.log(`[lyricSearch] Trying Letras.mus.br direct URL: ${url}`);
  
  return fetchHtml(url, {
    rejectRedirects: true,
  }, browser, signal).then(($) => {
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
  }).catch(async (err) => {
    if (signal?.aborted) throw err;
    if (!browser) throw err;
    
    console.log(`[lyricSearch] Letras.mus.br direct URL failed, trying search...`);
    const queryStr = encodeURIComponent(`${artistName} ${title}`);
    const searchUrl = `https://www.letras.mus.br/?q=${queryStr}#gsc.tab=0&gsc.q=${queryStr}`;
    console.log(`[lyricSearch] Letras search crawler: requesting URL search: ${searchUrl}`);
    
    const page = await browser.newPage();
    try {
      await page.setUserAgent(USER_AGENT);
      console.log(`[lyricSearch] Letras search crawler: Navigating page to searchUrl...`);
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 5000 });
      console.log(`[lyricSearch] Letras search crawler: Page loaded initial DOM. Waiting for CSE results selector 'a.gs-title'...`);
      await page.waitForSelector('a.gs-title', { timeout: 4000 });
      console.log(`[lyricSearch] Letras search crawler: CSE results selector 'a.gs-title' successfully loaded!`);
      const content = await page.content();
      const $ = cheerio.load(content);
      const results = $('a.gs-title');
      
      let bestLink: string | null = null;
      let bestScore = Infinity;
      
      // Pass 1: Try to find original lyrics (no translations)
      results.each((_, el) => {
        const $el = $(el);
        const href = $el.attr('href') || $el.attr('data-ctorig');
        if (!href || !href.includes('letras.mus.br')) return;
        if (href.endsWith('/traducao.html') || href.endsWith('/significado.html')) return;
        
        const text = $el.text();
        const parts = text.split('-');
        const resultTitle = parts[0]?.trim() || '';
        const resultArtist = parts[1]?.trim() || '';
        
        if (titleMatches(title, resultTitle)) {
          const score = levenshtein(artistName.toLowerCase(), resultArtist.toLowerCase());
          if (score < bestScore) {
            bestScore = score;
            bestLink = href;
          }
        }
      });
      
      // Pass 2: Fallback to translations if no original page found
      if (!bestLink) {
        results.each((_, el) => {
          const $el = $(el);
          const href = $el.attr('href') || $el.attr('data-ctorig');
          if (!href || !href.includes('letras.mus.br')) return;
          
          const text = $el.text();
          const parts = text.split('-');
          const resultTitle = parts[0]?.trim() || '';
          const resultArtist = parts[1]?.trim() || '';
          
          if (titleMatches(title, resultTitle)) {
            const score = levenshtein(artistName.toLowerCase(), resultArtist.toLowerCase());
            if (score < bestScore) {
              bestScore = score;
              bestLink = href;
            }
          }
        });
      }
      
      if (!bestLink) throw new Error('No matching result found in Letras search');
      
      console.log(`[lyricSearch] Found Letras.mus.br match URL from search: ${bestLink}`);
      const $lyricsPage = await fetchHtml(bestLink, {}, browser, signal);
      const el = $lyricsPage('.lyric-original p, .lyric-tra p');
      if (el.length === 0) throw new Error('Lyrics paragraph not found');
      let lyrics = '';
      el.each((_, p) => {
        const $p = $lyricsPage(p);
        $p.find('.romanization').remove();
        $p.find('br').replaceWith('\n');
        lyrics += $p.text().trim() + '\n\n';
      });
      return cleanLyrics(lyrics.trim());
    } catch (searchErr: any) {
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const errorHtml = await page.content().catch(() => 'Failed to capture page content');
        
        const isVercel = !!process.env.VERCEL;
        if (isVercel) {
          const filePath = path.join('/tmp', 'letras-search-error.html');
          await fs.writeFile(filePath, errorHtml, 'utf-8');
          console.error(`[lyricSearch] Letras search error HTML dumped to temp storage: ${filePath}`);
        } else {
          const scratchDir = path.join(process.cwd(), 'scratch');
          await fs.mkdir(scratchDir, { recursive: true });
          const filePath = path.join(scratchDir, 'letras-search-error.html');
          await fs.writeFile(filePath, errorHtml, 'utf-8');
          console.error(`[lyricSearch] Letras search error HTML dumped to: ${filePath}`);
        }
      } catch (dumpErr) {
        console.error('[lyricSearch] Failed to dump search page content:', dumpErr);
      }
      throw searchErr;
    } finally {
      await page.close().catch(() => {});
    }
  });
}

/**
 * Lyrics.com - search then scrape
 */
function fromLyricsCom(title: string, artistName: string, browser?: Browser, signal?: AbortSignal): Promise<string> {
  const searchUrl =
    'https://www.lyrics.com/serp.php?st=' +
    encodeURIComponent(title + ' ' + artistName) +
    '&stype=1';
  console.log(`[lyricSearch] Trying Lyrics.com search URL: ${searchUrl}`);
  return fetchHtml(searchUrl, {}, browser, signal)
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
      console.log(`[lyricSearch] Trying Lyrics.com match URL: ${url}`);
      return fetchHtml(url, {}, browser, signal);
    })
    .then(($) => {
      const el = $('#lyric-body-text');
      if (el.length === 0) throw new Error('Not found');
      el.find('br').replaceWith('\n');
      return cleanLyrics(el.text().trim());
    });
}

/**
 * Paroles.net - French lyrics site, works well
 */
function fromParolesNet(title: string, artistName: string, browser?: Browser, signal?: AbortSignal): Promise<string> {
  const lyricsUrl = (s: string) => kebabCase(deburr(s.trim().toLowerCase()));
  const url = 'https://www.paroles.net/' + lyricsUrl(artistName) + '/paroles-' + lyricsUrl(title);
  console.log(`[lyricSearch] Trying Paroles.net direct URL: ${url}`);
  return fetchHtml(url, { rejectRedirects: true }, browser, signal).then(($) => {
    const el = $('.song-text');
    if (el.length === 0) throw new Error('Not found');
    // Remove header and ad divs that are mixed into lyrics
    el.find('h2').remove();
    el.find('div[id], div[class]').remove();
    return cleanLyrics(textln(el));
  });
}

/**
 * lyrics.ovh - open public API
 */
function fromOvh(title: string, artistName: string, signal?: AbortSignal): Promise<string> {
  const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artistName)}/${encodeURIComponent(title)}`;
  console.log(`[lyricSearch] Trying lyrics.ovh API URL: ${url}`);
  return fetch(url, {
    headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
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

/**
 * LyricsMania - multiple URL patterns
 */
function fromLyricsMania(title: string, artistName: string, browser?: Browser, signal?: AbortSignal): Promise<string> {
  const maniaUrl = (s: string) => snakeCase(deburr(s.trim().toLowerCase()));
  const urls = [
    'https://www.lyricsmania.com/' + maniaUrl(title) + '_lyrics_' + maniaUrl(artistName) + '.html',
    'https://www.lyricsmania.com/' + maniaUrl(title) + '_' + maniaUrl(artistName) + '.html',
  ];
  return Promise.any(
    urls.map((url) => {
      console.log(`[lyricSearch] Trying LyricsMania direct URL: ${url}`);
      return fetchHtml(url, { rejectRedirects: true }, browser, signal).then(($) => {
        if ($('.lyrics-body').length === 0) throw new Error('Not found');
        return cleanLyrics(textln($('.lyrics-body')));
      });
    })
  );
}

// ── Main ─────────────────────────────────────────────────────

const GENIUS_ADVANTAGE_MS = 2000; // Milliseconds advantage given to Genius

function runDelayed<T>(
  ms: number,
  signal: AbortSignal | undefined,
  fn: () => Promise<T>
): Promise<T> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new Error('Aborted before start'));
    }

    let timeoutId: NodeJS.Timeout;
    let abortHandler: (() => void) | undefined;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (signal && abortHandler) {
        signal.removeEventListener('abort', abortHandler);
      }
    };

    abortHandler = () => {
      cleanup();
      reject(new Error('Aborted'));
    };

    if (signal) {
      signal.addEventListener('abort', abortHandler);
    }

    timeoutId = setTimeout(() => {
      if (signal?.aborted) {
        cleanup();
        return reject(new Error('Aborted before start'));
      }
      fn()
        .then((val) => {
          cleanup();
          resolve(val);
        })
        .catch((err) => {
          cleanup();
          reject(err);
        });
    }, ms);
  });
}

/**
 * Find lyrics for a song by querying multiple sources in parallel.
 * Returns the first successful result.
 * @param {string} title
 * @param {string} artistName
 * @returns {Promise<string>}
 */
export async function findLyrics(title: string, artistName: string, browserInput?: Browser): Promise<string> {
  const key = artistName.toLowerCase() + '\n' + title.toLowerCase();
  const cached = cacheGet(key);
  if (cached) return Promise.resolve(cached);

  const controller = new AbortController();
  const { signal } = controller;

  let browser = browserInput;
  let launchedBrowser = false;

  if (!browser) {
    console.log('[lyricSearch] Launching Puppeteer browser...');
    browser = await launchBrowser();
    launchedBrowser = true;
  }

  try {
    const logError = (source: string, err: any) => {
      if (!signal?.aborted && err.message !== 'Aborted' && err.message !== 'Aborted before start') {
        console.warn(`[lyricSearch] ${source} failed:`, err.message);
      }
      throw err;
    };

    const promises = [
      // Genius starts immediately
      fromGenius(title, artistName, browser, signal)
        .then((l) => ({ source: 'Genius', lyrics: l }))
        .catch((err) => logError('Genius', err)),

      // lyrics.ovh also starts immediately alongside Genius
      fromOvh(title, artistName, signal)
        .then((l) => ({ source: 'lyrics.ovh', lyrics: l }))
        .catch((err) => logError('lyrics.ovh', err)),

      // Other sources start with a delay (Genius advantage)
      runDelayed(GENIUS_ADVANTAGE_MS, signal, () =>
        fromAZLyrics(title, artistName, browser, signal).then((l) => ({ source: 'AZLyrics', lyrics: l }))
      ).catch((err) => logError('AZLyrics', err)),
      runDelayed(GENIUS_ADVANTAGE_MS, signal, () =>
        fromParolesNet(title, artistName, browser, signal).then((l) => ({ source: 'Paroles.net', lyrics: l }))
      ).catch((err) => logError('Paroles.net', err)),
      runDelayed(GENIUS_ADVANTAGE_MS, signal, () =>
        fromLyricsMania(title, artistName, browser, signal).then((l) => ({ source: 'LyricsMania', lyrics: l }))
      ).catch((err) => logError('LyricsMania', err)),
      fromLetras(title, artistName, browser, signal)
        .then((l) => ({ source: 'Letras', lyrics: l }))
        .catch((err) => logError('Letras', err)),
      runDelayed(GENIUS_ADVANTAGE_MS, signal, () =>
        fromLyricsCom(title, artistName, browser, signal).then((l) => ({ source: 'Lyrics.com', lyrics: l }))
      ).catch((err) => logError('Lyrics.com', err)),
    ];

    // If title has parentheses/brackets, also try without them (run delayed)
    if (/\(.*\)/.test(title) || /\[.*\]/.test(title)) {
      const cleanTitle = title
        .replace(/\(.*\)/g, '')
        .replace(/\[.*\]/g, '')
        .trim();
      promises.push(
        runDelayed(GENIUS_ADVANTAGE_MS, signal, () =>
          findLyrics(cleanTitle, artistName, browser).then((l) => ({
            source: 'Fallback (Clean Title)',
            lyrics: l,
          }))
        ).catch((err) => logError('Fallback (Clean Title)', err))
      );
    }

    // If artist contains separators (feat., &, /), try with just the primary artist (run delayed)
    const primaryArtist = artistName.split(/\s*(?:feat\.?|ft\.?|featuring|&|\/|,|;)\s*/i)[0].trim();
    if (primaryArtist && primaryArtist.length > 1 && primaryArtist !== artistName) {
      promises.push(
        runDelayed(GENIUS_ADVANTAGE_MS, signal, () =>
          findLyrics(title, primaryArtist, browser).then((l) => ({
            source: 'Fallback (Primary Artist)',
            lyrics: l,
          }))
        ).catch((err) => logError('Fallback (Primary Artist)', err))
      );
    }

    const { source, lyrics } = await Promise.any(promises);
    controller.abort(); // Cancel all pending timeouts and active connections immediately!
    console.log(
      `[lyricSearch] Selected lyrics from source: ${source} for "${title}" - "${artistName}"`
    );
    cacheSet(key, lyrics);
    return lyrics;
  } catch (err) {
    controller.abort(); // Clean up on overall failure too
    throw err;
  } finally {
    if (launchedBrowser && browser) {
      console.log('[lyricSearch] Closing Puppeteer browser...');
      await browser.close().catch((e) => console.error('Error closing browser:', e));
    }
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
  } catch (error: any) {
    console.error('Failed to fetch lyrics:', error);
    return NextResponse.json({
      error: 'Failed to fetch lyrics',
      message: error?.message || String(error),
      stack: error?.stack,
    }, { status: 500 });
  }
}
