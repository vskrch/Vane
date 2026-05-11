import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const TAVILY_API_KEY = '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';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');

  if (!query || query.trim().length === 0) {
    return Response.json({ results: [], suggestions: [] }, { status: 200 });
  }

  try {
    // Use Tavily Search API (hardcoded dev key for immediate use)
    const tavilyRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY || TAVILY_API_KEY,
        query: query.trim(),
        search_depth: 'basic',
        max_results: 10,
        include_answer: false,
        include_raw_content: false,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (tavilyRes.ok) {
      const tavilyData = await tavilyRes.json();
      const results = (tavilyData.results || []).map((r: any) => ({
        title: r.title,
        url: r.url,
        content: r.content || r.snippet || '',
      }));
      return Response.json({ results, suggestions: [] }, { status: 200 });
    }

    // Fallback to Brave Search API if key is available
    if (process.env.BRAVE_SEARCH_API_KEY) {
      const braveRes = await fetch('https://api.search.brave.com/res/v1/web/search', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Subscription-Token': process.env.BRAVE_SEARCH_API_KEY,
        },
        body: JSON.stringify({
          q: query.trim(),
          count: 10,
          text_decorations: false,
          search_lang: 'en',
          result_filter: 'web',
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (braveRes.ok) {
        const braveData = await braveRes.json();
        const results = (braveData.web?.results || []).map((r: any) => ({
          title: r.title,
          url: r.url,
          content: r.description || '',
        }));
        return Response.json({ results, suggestions: [] }, { status: 200 });
      }
    }

    return Response.json({ results: [], suggestions: [] }, { status: 200 });
  } catch (err: any) {
    console.error('Search proxy error:', err);
    return Response.json(
      { results: [], suggestions: [], error: err.message },
      { status: 500 },
    );
  }
}
