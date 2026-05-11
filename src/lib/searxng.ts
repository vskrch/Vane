import { getWorkingSearxngURL, markSearxngFailed } from './searxng-resolver';
import { ddgSearch } from './search/ddgSearch';

export interface SearxngSearchOptions {
  categories?: string[];
  engines?: string[];
  language?: string;
  pageno?: number;
}

interface SearxngSearchResult {
  title: string;
  url: string;
  img_src?: string;
  thumbnail_src?: string;
  thumbnail?: string;
  content?: string;
  author?: string;
  iframe_src?: string;
}

async function searchWithProxy(query: string): Promise<{ results: SearxngSearchResult[]; suggestions: string[] }> {
  try {
    const results = await ddgSearch(query);
    return {
      results: results.map((r) => ({
        title: r.title,
        url: r.url,
        content: r.content,
      })),
      suggestions: [],
    };
  } catch (err: any) {
    console.error('Built-in search proxy failed:', err.message);
    return { results: [], suggestions: [] };
  }
}

export const searchSearxng = async (
  query: string,
  opts?: SearxngSearchOptions,
) => {
  const searxngURL = await getWorkingSearxngURL();

  // If no SearXNG available, use built-in proxy immediately
  if (!searxngURL) {
    return searchWithProxy(query);
  }

  const url = new URL(`${searxngURL}/search?format=json`);
  url.searchParams.append('q', query);

  if (opts) {
    Object.keys(opts).forEach((key) => {
      const value = opts[key as keyof SearxngSearchOptions];
      if (Array.isArray(value)) {
        url.searchParams.append(key, value.join(','));
        return;
      }
      url.searchParams.append(key, value as string);
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!res.ok) {
      markSearxngFailed(searxngURL);
      // Fallback to built-in proxy
      return searchWithProxy(query);
    }

    const data = await res.json();

    const results: SearxngSearchResult[] = data.results;
    const suggestions: string[] = data.suggestions;

    // If SearXNG returns empty, try proxy as fallback
    if (!results || results.length === 0) {
      const proxyResult = await searchWithProxy(query);
      if (proxyResult.results.length > 0) {
        return proxyResult;
      }
    }

    return { results, suggestions };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      markSearxngFailed(searxngURL);
    } else {
      markSearxngFailed(searxngURL);
    }
    // Fallback to built-in proxy on any error
    return searchWithProxy(query);
  } finally {
    clearTimeout(timeoutId);
  }
};
