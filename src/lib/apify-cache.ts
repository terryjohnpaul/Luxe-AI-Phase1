/**
 * Apify-specific cache — 24h TTL to avoid burning compute units.
 * Fashion trends don't change hourly. Refresh once per day.
 */

import fs from "fs";
import path from "path";

const CACHE_DIR = path.join(process.cwd(), ".cache", "apify");
const APIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

try { fs.mkdirSync(CACHE_DIR, { recursive: true }); } catch {}

interface ApifyCacheEntry {
  data: any;
  fetchedAt: string;
}

const memCache: Record<string, ApifyCacheEntry> = {};

// Load from disk on startup
try {
  const files = fs.readdirSync(CACHE_DIR).filter(f => f.endsWith(".json"));
  for (const file of files) {
    const key = file.replace(".json", "");
    try {
      const raw = fs.readFileSync(path.join(CACHE_DIR, file), "utf-8");
      memCache[key] = JSON.parse(raw);
    } catch {}
  }
  if (files.length > 0) console.log(`[apify-cache] Loaded ${files.length} cached Apify results from disk`);
} catch {}

/**
 * Cache Apify results for 24 hours. Only calls Apify if cache is expired.
 */
export async function cachedApifyCall<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<{ data: T; fromCache: boolean }> {
  const existing = memCache[key];

  if (existing) {
    const age = Date.now() - new Date(existing.fetchedAt).getTime();
    if (age < APIFY_TTL_MS) {
      return { data: existing.data, fromCache: true };
    }
  }

  // Cache expired or doesn't exist — fetch fresh
  try {
    const data = await fetcher();
    const entry = { data, fetchedAt: new Date().toISOString() };
    memCache[key] = entry;
    try {
      fs.writeFileSync(path.join(CACHE_DIR, `${key}.json`), JSON.stringify(entry), "utf-8");
    } catch {}
    return { data, fromCache: false };
  } catch (err) {
    // On error, return stale cache if available
    if (existing) {
      return { data: existing.data, fromCache: true };
    }
    throw err;
  }
}
