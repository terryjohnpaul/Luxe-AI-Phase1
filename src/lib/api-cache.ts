/**
 * Disk-backed API cache for Intelligence pages.
 * Survives PM2 restarts — loads from disk instantly, refreshes in background.
 * Cache TTL: 1 hour. Auto-refreshes at 80% staleness.
 */

import fs from "fs";
import path from "path";

const CACHE_DIR = path.join(process.cwd(), ".cache");
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CacheEntry {
  data: any;
  fetchedAt: string;
  refreshing: boolean;
}

const cache: Record<string, CacheEntry> = {};

// Ensure cache directory exists
try { fs.mkdirSync(CACHE_DIR, { recursive: true }); } catch {}

function diskPath(key: string): string {
  return path.join(CACHE_DIR, `${key}.json`);
}

function writeToDisk(key: string, entry: { data: any; fetchedAt: string }) {
  try {
    fs.writeFileSync(diskPath(key), JSON.stringify(entry), "utf-8");
  } catch (err) {
    console.error(`[cache] Disk write failed for ${key}:`, err);
  }
}

function readFromDisk(key: string): { data: any; fetchedAt: string } | null {
  try {
    const raw = fs.readFileSync(diskPath(key), "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Load all disk cache into memory on startup
try {
  const files = fs.readdirSync(CACHE_DIR).filter(f => f.endsWith(".json"));
  for (const file of files) {
    const key = file.replace(".json", "");
    const diskData = readFromDisk(key);
    if (diskData) {
      cache[key] = { ...diskData, refreshing: false };
      console.log(`[cache] Loaded ${key} from disk (fetched: ${diskData.fetchedAt})`);
    }
  }
  if (files.length > 0) console.log(`[cache] Restored ${files.length} cache entries from disk`);
} catch {}

// Registry of fetchers for startup pre-warming
const registeredFetchers: Record<string, () => Promise<any>> = {};

/**
 * Register a fetcher for pre-warming. When any cachedFetch runs,
 * it triggers background pre-warming for ALL registered keys that aren't cached yet.
 */
export function registerForPrewarm(key: string, fetcher: () => Promise<any>) {
  registeredFetchers[key] = fetcher;
}

// Hourly background refresh for all registered fetchers
let intervalStarted = false;
function startHourlyRefresh() {
  if (intervalStarted) return;
  intervalStarted = true;
  setInterval(async () => {
    const keys = Object.keys(registeredFetchers);
    if (keys.length === 0) return;
    console.log(`[cache] Hourly refresh for ${keys.length} entries...`);
    for (const [key, fetcher] of Object.entries(registeredFetchers)) {
      try {
        const data = await fetcher();
        cache[key] = { data, fetchedAt: new Date().toISOString(), refreshing: false };
        writeToDisk(key, cache[key]);
      } catch (err) {
        console.error(`[cache] Hourly refresh failed for ${key}:`, err);
      }
    }
    console.log(`[cache] Hourly refresh complete`);
  }, CACHE_TTL_MS);
}

// Pre-warm uncached entries in background
let prewarmStarted = false;
function triggerPrewarm() {
  if (prewarmStarted) return;
  prewarmStarted = true;
  setTimeout(async () => {
    const uncached = Object.entries(registeredFetchers).filter(([key]) => !cache[key]);
    if (uncached.length === 0) return;
    console.log(`[cache] Pre-warming ${uncached.length} uncached entries: ${uncached.map(([k]) => k).join(", ")}`);
    for (const [key, fetcher] of uncached) {
      if (cache[key]) continue; // Another request may have filled it
      try {
        const data = await fetcher();
        const fetchedAt = new Date().toISOString();
        cache[key] = { data, fetchedAt, refreshing: false };
        writeToDisk(key, cache[key]);
        console.log(`[cache] Pre-warmed ${key}`);
      } catch (err) {
        console.error(`[cache] Pre-warm failed for ${key}:`, err);
      }
    }
  }, 3000);
}

/**
 * Get cached data or fetch fresh. Returns cached data instantly if available.
 * Refreshes in background when cache is >80% stale.
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  forceRefresh = false
): Promise<{ data: T; fetchedAt: string; fromCache: boolean }> {
  // Trigger pre-warm + hourly refresh on first cachedFetch call
  triggerPrewarm();
  startHourlyRefresh();

  const existing = cache[key];
  const now = Date.now();

  // Return cache if fresh and not forced
  if (existing && !forceRefresh) {
    const age = now - new Date(existing.fetchedAt).getTime();

    if (age < CACHE_TTL_MS) {
      // Pre-refresh at 80% TTL in background
      if (age > CACHE_TTL_MS * 0.8 && !existing.refreshing) {
        existing.refreshing = true;
        fetcher().then(data => {
          cache[key] = { data, fetchedAt: new Date().toISOString(), refreshing: false };
          writeToDisk(key, cache[key]);
        }).catch(() => { existing.refreshing = false; });
      }
      return { data: existing.data, fetchedAt: existing.fetchedAt, fromCache: true };
    }
  }

  // Stale or no cache — but if stale cache exists and someone else is fetching, return stale
  if (existing && existing.refreshing) {
    return { data: existing.data, fetchedAt: existing.fetchedAt, fromCache: true };
  }

  // Even if expired, return stale data immediately and refresh in background
  if (existing && !forceRefresh) {
    existing.refreshing = true;
    fetcher().then(data => {
      cache[key] = { data, fetchedAt: new Date().toISOString(), refreshing: false };
      writeToDisk(key, cache[key]);
    }).catch(() => { existing.refreshing = false; });
    return { data: existing.data, fetchedAt: existing.fetchedAt, fromCache: true };
  }

  // No cache at all — must wait for fetch
  if (existing) existing.refreshing = true;

  try {
    const data = await fetcher();
    const fetchedAt = new Date().toISOString();
    cache[key] = { data, fetchedAt, refreshing: false };
    writeToDisk(key, cache[key]);
    return { data, fetchedAt, fromCache: false };
  } catch (err) {
    if (existing) {
      existing.refreshing = false;
      return { data: existing.data, fetchedAt: existing.fetchedAt, fromCache: true };
    }
    throw err;
  }
}
