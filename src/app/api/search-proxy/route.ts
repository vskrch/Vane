import { NextRequest } from 'next/server';
import { ddgSearch } from '@/lib/search/ddgSearch';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');

  if (!query || query.trim().length === 0) {
    return Response.json({ results: [], suggestions: [] }, { status: 200 });
  }

  try {
    const results = await ddgSearch(query.trim());

    const unique = Array.from(
      new Map(results.map((r) => [r.url, r])).values(),
    );

    return Response.json(
      {
        results: unique,
        suggestions: [],
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('Search proxy error:', err);
    return Response.json(
      { results: [], suggestions: [], error: err.message },
      { status: 500 },
    );
  }
}
