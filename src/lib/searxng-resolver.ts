import { getSearxngURL } from './config/serverRegistry';

interface SearXNGInstance {
  url: string;
  successRate: number;
  avgTiming: number;
}

let cachedInstances: SearXNGInstance[] = [];
let lastFetchTime = 0;
let currentIndex = -1;
const CACHE_TTL = 15 * 60 * 1000;
const FETCH_TIMEOUT = 8000;

const SEARX_SPACE_URL = 'https://searx.space/data/instances.json';

async function fetchInstances(): Promise<SearXNGInstance[]> {
  if (Date.now() - lastFetchTime < CACHE_TTL && cachedInstances.length > 0) {
    return cachedInstances;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const res = await fetch(SEARX_SPACE_URL, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return cachedInstances;

    const data = await res.json();
    const instances = data?.instances || {};

    const working: SearXNGInstance[] = [];

    for (const [url, info] of Object.entries(instances)) {
      const i = info as any;
      if (
        i.http?.status_code === 200 &&
        !i.http?.error &&
        i.timing?.search?.success_percentage != null &&
        i.timing.search.success_percentage >= 90 &&
        i.version
      ) {
        working.push({
          url,
          successRate: i.timing.search.success_percentage,
          avgTiming: i.timing.search.all?.median ?? 1,
        });
      }
    }

    working.sort((a, b) => b.successRate - a.successRate);

    if (working.length > 0) {
      cachedInstances = working;
      lastFetchTime = Date.now();
    }
  } catch (err) {
    console.error('Failed to fetch SearXNG instances:', err);
  }

  return cachedInstances;
}

export async function getWorkingSearxngURL(): Promise<string | null> {
  const configURL = getSearxngURL();
  if (configURL) return configURL;

  const instances = await fetchInstances();
  if (instances.length === 0) return null;

  currentIndex = (currentIndex + 1) % instances.length;
  return instances[currentIndex].url;
}

export function markSearxngFailed(url: string) {
  cachedInstances = cachedInstances.filter((i) => i.url !== url);
}
