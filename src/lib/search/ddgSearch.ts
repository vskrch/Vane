const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const TIMEOUT = 8000;

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  img_src?: string;
  thumbnail?: string;
}

export async function ddgSearch(query: string): Promise<SearchResult[]> {
  const url = 'https://html.duckduckgo.com/html/';
  const data = new URLSearchParams({ q: query });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const res = await fetch(url, {
      method: 'POST',
      body: data,
      headers: {
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'text/html',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`DDG error: ${res.status}`);
    }

    const html = await res.text();
    const results: SearchResult[] = [];

    const resultRegex =
      /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

    function decodeDdgUrl(href: string): string {
      if (href.startsWith('/l/?uddg=') || href.startsWith('https://duckduckgo.com/l/?uddg=')) {
        const uddgIndex = href.indexOf('uddg=');
        if (uddgIndex !== -1) {
          try {
            return decodeURIComponent(href.slice(uddgIndex + 5));
          } catch {
            return href;
          }
        }
      }
      // Handle relative URLs
      if (href.startsWith('//')) {
        return 'https:' + href;
      }
      if (href.startsWith('/')) {
        return 'https://duckduckgo.com' + href;
      }
      return href;
    }

    let match;
    while ((match = resultRegex.exec(html)) !== null) {
      const rawHref = match[1];
      const title = match[2].replace(/<[^>]+>/g, '').trim();
      const snippet = match[3].replace(/<[^>]+>/g, '').trim();
      const href = decodeDdgUrl(rawHref);

      if (href && title) {
        results.push({
          title,
          url: href,
          content: snippet,
        });
      }
    }

    if (results.length === 0) {
      const simpleRegex =
        /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
      while ((match = simpleRegex.exec(html)) !== null) {
        const rawHref = match[1];
        const title = match[2].replace(/<[^>]+>/g, '').trim();
        const href = decodeDdgUrl(rawHref);
        if (href && title && !results.find((r) => r.url === href)) {
          results.push({
            title,
            url: href,
            content: '',
          });
        }
      }
    }

    return results.slice(0, 20);
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error('DuckDuckGo search error:', err.message);
    return [];
  }
}
