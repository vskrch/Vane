import { getWorkingSearxngURL, markSearxngFailed } from './searxng-resolver';

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

async function searchDuckDuckGo(query: string): Promise<{
  results: SearxngSearchResult[];
  suggestions: string[];
}> {
  try {
    const url = new URL("https://lite.duckduckgo.com/lite/");
    url.searchParams.append("q", query);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return { results: [], suggestions: [] };

    const html = await res.text();
    const results: SearxngSearchResult[] = [];

    const rowRegex =
      /<tr[^>]*class="[^"]*result[^"]*"[^>]*>[\s\S]*?<\/tr>/gi;
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>(?:<[^>]+>)*([^<]+)/i;
    const snippetRegex =
      /<td[^>]*class="[^"]*result-snippet[^"]*"[^>]*>([\s\S]*?)<\/td>/i;

    let match;
    while ((match = rowRegex.exec(html)) !== null) {
      const row = match[0];
      const linkMatch = row.match(linkRegex);
      const snippetMatch = row.match(snippetRegex);

      if (linkMatch) {
        results.push({
          title: linkMatch[2]?.replace(/<[^>]+>/g, "").trim() || query,
          url: linkMatch[1],
          content: snippetMatch
            ? snippetMatch[1]?.replace(/<[^>]+>/g, "").trim()
            : "",
        });
      }
    }

    return { results: results.slice(0, 20), suggestions: [] };
  } catch {
    return { results: [], suggestions: [] };
  }
}

export const searchSearxng = async (
  query: string,
  opts?: SearxngSearchOptions,
) => {
  const searxngURL = await getWorkingSearxngURL();

  if (!searxngURL) {
    return searchDuckDuckGo(query);
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
      throw new Error(`SearXNG error: ${res.statusText}`);
    }

    const data = await res.json();

    const results: SearxngSearchResult[] = data.results;
    const suggestions: string[] = data.suggestions;

    return { results, suggestions };
  } catch (err: any) {
    markSearxngFailed(searxngURL);
    return searchDuckDuckGo(query);
  } finally {
    clearTimeout(timeoutId);
  }
};
