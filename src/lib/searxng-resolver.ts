import { getSearxngURL } from './config/serverRegistry';

interface SearXNGInstance {
  url: string;
  successRate: number;
  avgTiming: number;
  failCount: number;
  cooldownUntil: number;
}

let cachedInstances: SearXNGInstance[] = [];
let lastFetchTime = 0;
let fetchPromise: Promise<SearXNGInstance[]> | null = null;
const CACHE_TTL = 5 * 60 * 1000;
const FETCH_TIMEOUT = 6000;
const COOLDOWN_MS = 30000;
const MAX_FAILS = 3;

const FALLBACK_INSTANCES: SearXNGInstance[] = [
  {
    url: 'https://baresearch.org',
    successRate: 100,
    avgTiming: 0.8,
    failCount: 0,
    cooldownUntil: 0,
  },
  {
    url: 'https://etsi.me',
    successRate: 100,
    avgTiming: 0.5,
    failCount: 0,
    cooldownUntil: 0,
  },
  {
    url: 'https://search.sapti.me',
    successRate: 99,
    avgTiming: 0.9,
    failCount: 0,
    cooldownUntil: 0,
  },
  {
    url: 'https://priv.au',
    successRate: 99,
    avgTiming: 0.7,
    failCount: 0,
    cooldownUntil: 0,
  },
  {
    url: 'https://opnxng.com',
    successRate: 98,
    avgTiming: 0.6,
    failCount: 0,
    cooldownUntil: 0,
  },
];

const SEARX_SPACE_URL = 'https://searx.space/data/instances.json';

async function fetchInstances(): Promise<SearXNGInstance[]> {
  const now = Date.now();
  if (cachedInstances.length > 0 && now - lastFetchTime < CACHE_TTL) {
    return cachedInstances;
  }

  if (fetchPromise) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      const res = await fetch(SEARX_SPACE_URL, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; VaneBot/1.0; +https://github.com/ItzCrazyKns/Vane)',
        },
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const instances = data?.instances || {};

      const working: SearXNGInstance[] = [];

      for (const [url, info] of Object.entries(instances)) {
        const i = info as any;
        const searchTiming = i.timing?.search;
        const successRate = searchTiming?.success_percentage;
        const httpStatus = i.http?.status_code;
        const httpError = i.http?.error;

        if (
          httpStatus === 200 &&
          !httpError &&
          successRate != null &&
          successRate >= 85 &&
          i.version
        ) {
          const avgTime =
            searchTiming.all?.median != null
              ? searchTiming.all.median
              : searchTiming.server?.median != null
                ? searchTiming.server.median * 2
                : 1;

          working.push({
            url,
            successRate,
            avgTiming: avgTime,
            failCount: 0,
            cooldownUntil: 0,
          });
        }
      }

      working.sort((a, b) => {
        const scoreA =
          a.successRate * 100 - a.avgTiming * 10 - a.failCount * 20;
        const scoreB =
          b.successRate * 100 - b.avgTiming * 10 - b.failCount * 20;
        return scoreB - scoreA;
      });

      if (working.length > 0) {
        cachedInstances = working;
        lastFetchTime = Date.now();
      }
    } catch (err) {
      console.error('Failed to fetch SearXNG instances:', err);
    } finally {
      fetchPromise = null;
    }

    if (cachedInstances.length === 0) {
      cachedInstances = FALLBACK_INSTANCES.map((i) => ({ ...i }));
    }

    return cachedInstances;
  })();

  return fetchPromise;
}

export async function getWorkingSearxngURL(): Promise<string | null> {
  const configURL = getSearxngURL();
  if (configURL) return configURL;

  const instances = await fetchInstances();
  if (instances.length === 0) return null;

  const now = Date.now();
  const alive = instances.filter(
    (i) => i.cooldownUntil < now && i.failCount < MAX_FAILS,
  );

  if (alive.length === 0) {
    instances.forEach((i) => {
      i.failCount = 0;
      i.cooldownUntil = 0;
    });
    if (instances.length === 0) return null;
    return instances[0].url;
  }

  return alive[0].url;
}

export function markSearxngFailed(url: string) {
  const inst = cachedInstances.find((i) => i.url === url);
  if (inst) {
    inst.failCount++;
    inst.cooldownUntil = Date.now() + COOLDOWN_MS;
  }

  const alive = cachedInstances.filter(
    (i) => i.cooldownUntil < Date.now() || i.failCount < MAX_FAILS,
  );

  if (alive.length === 0 && cachedInstances.length > 0) {
    lastFetchTime = 0;
    fetchPromise = null;
  }
}
