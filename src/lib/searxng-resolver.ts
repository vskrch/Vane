import { getSearxngURL } from './config/serverRegistry';

interface SearXNGInstance {
  url: string;
  successRate: number;
  avgTiming: number;
  failCount: number;
}

let cachedInstances: SearXNGInstance[] = [];
let lastFetchTime = 0;
let currentIndex = -1;
let consecutiveFailures = 0;
const CACHE_TTL = 15 * 60 * 1000;
const FETCH_TIMEOUT = 5000;
const MAX_CONSECUTIVE_FAILURES = 3;

const FALLBACK_INSTANCES: SearXNGInstance[] = [
  {
    url: 'https://baresearch.org',
    successRate: 100,
    avgTiming: 0.9,
    failCount: 0,
  },
  {
    url: 'https://search.sapti.me',
    successRate: 98,
    avgTiming: 0.8,
    failCount: 0,
  },
  { url: 'https://paulgo.io', successRate: 97, avgTiming: 0.7, failCount: 0 },
  { url: 'https://searx.be', successRate: 96, avgTiming: 0.6, failCount: 0 },
  {
    url: 'https://search.hbubli.cc',
    successRate: 95,
    avgTiming: 0.8,
    failCount: 0,
  },
];

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
      const successRate = i.timing?.search?.success_percentage;
      if (
        i.http?.status_code === 200 &&
        !i.http?.error &&
        successRate != null &&
        successRate >= 80 &&
        i.version
      ) {
        working.push({
          url,
          successRate,
          avgTiming: i.timing.search.all?.median ?? 1,
          failCount: 0,
        });
      }
    }

    working.sort((a, b) => {
      if (b.successRate !== a.successRate) return b.successRate - a.successRate;
      return a.avgTiming - b.avgTiming;
    });

    if (working.length > 0) {
      cachedInstances = working;
      lastFetchTime = Date.now();
      consecutiveFailures = 0;
    }
  } catch (err) {
    console.error('Failed to fetch SearXNG instances:', err);
  }

  if (cachedInstances.length === 0) {
    cachedInstances = [...FALLBACK_INSTANCES];
    lastFetchTime = Date.now();
  }

  return cachedInstances;
}

export async function getWorkingSearxngURL(): Promise<string | null> {
  const configURL = getSearxngURL();
  if (configURL) return configURL;

  if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
    await fetchInstances();
  }

  const instances = await fetchInstances();
  if (instances.length === 0) return null;

  const alive = instances.filter((i) => i.failCount === 0);
  if (alive.length === 0) return null;

  currentIndex = (currentIndex + 1) % alive.length;
  return alive[currentIndex].url;
}

export function markSearxngFailed(url: string) {
  consecutiveFailures++;
  const inst = cachedInstances.find((i) => i.url === url);
  if (inst) {
    inst.failCount++;
  }
  if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
    cachedInstances = [];
    lastFetchTime = 0;
  }
}
