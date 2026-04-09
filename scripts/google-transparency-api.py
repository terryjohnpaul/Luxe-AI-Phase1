"""
Google Ads Transparency API Microservice
Runs on port 3201, caches results to avoid rate limiting
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import time
import traceback
from google_ads_transparency_mcp import GoogleAdsTransparency

COMPETITORS = [
    {"name": "Tata CLiQ", "domain": "tatacliq.com", "category": "direct_competitor"},
    {"name": "Myntra", "domain": "myntra.com", "category": "direct_competitor"},
    {"name": "Hugo Boss", "domain": "hugoboss.com", "category": "brand_direct"},
    {"name": "Coach", "domain": "coach.com", "category": "brand_direct"},
    {"name": "Diesel", "domain": "diesel.com", "category": "brand_direct"},
    {"name": "Michael Kors", "domain": "michaelkors.com", "category": "brand_direct"},
]

# Cache with TTL
cache = {}
CACHE_TTL = 1800  # 30 minutes

def get_cached(key):
    if key in cache:
        data, ts = cache[key]
        if time.time() - ts < CACHE_TTL:
            return data
    return None

def set_cache(key, data):
    cache[key] = (data, time.time())

def get_client():
    """Create a fresh client for each batch of requests"""
    client = GoogleAdsTransparency()
    return client

def fetch_all_competitors(count=5):
    cache_key = f"all_competitors_{count}"
    cached = get_cached(cache_key)
    if cached is not None:
        print(f"[Cache HIT] all_competitors ({len(cached)} ads)")
        return cached

    client = get_client()
    all_ads = []

    for comp in COMPETITORS:
        try:
            # Add small delay between competitors to avoid rate limiting
            if all_ads:
                time.sleep(1)

            ads = client.get_ads(comp["name"], count=count)
            for ad in ads:
                ad["competitor_name"] = comp["name"]
                ad["competitor_category"] = comp["category"]
            all_ads.extend(ads)
            print(f"[Fetch] {comp['name']}: {len(ads)} ads")
        except Exception as e:
            print(f"[Error] {comp['name']}: {e}")

    set_cache(cache_key, all_ads)
    print(f"[Cache SET] all_competitors: {len(all_ads)} ads")
    return all_ads


# Pre-populate cache on startup
print("Pre-populating cache...")
try:
    startup_ads = fetch_all_competitors(5)
    print(f"Startup cache: {len(startup_ads)} ads loaded")
except Exception as e:
    print(f"Startup cache failed: {e}")


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)

        try:
            if parsed.path == "/health":
                self.respond(200, {"status": "ok", "cached_keys": len(cache)})

            elif parsed.path == "/api/search":
                query = params.get("q", [""])[0]
                if not query:
                    self.respond(400, {"error": "Missing ?q= parameter"})
                    return
                cache_key = f"search_{query}"
                results = get_cached(cache_key)
                if results is None:
                    client = get_client()
                    results = client.search_advertisers(query)
                    set_cache(cache_key, results)
                self.respond(200, {"results": results})

            elif parsed.path == "/api/ads":
                name = params.get("name", [""])[0]
                count = int(params.get("count", ["10"])[0])
                if not name:
                    self.respond(400, {"error": "Missing ?name= parameter"})
                    return
                cache_key = f"ads_{name}_{count}"
                ads = get_cached(cache_key)
                if ads is None:
                    client = get_client()
                    ads = client.get_ads(name, count=count)
                    set_cache(cache_key, ads)
                self.respond(200, {"ads": ads, "count": len(ads)})

            elif parsed.path == "/api/all-competitors":
                competitor = params.get("competitor", ["all"])[0]
                count = int(params.get("count", ["5"])[0])

                all_ads = fetch_all_competitors(count)

                if competitor != "all":
                    all_ads = [a for a in all_ads
                              if competitor.lower() in a.get("competitor_name", "").lower()]

                self.respond(200, {
                    "ads": all_ads,
                    "total": len(all_ads),
                    "competitors_checked": len(COMPETITORS),
                })

            elif parsed.path == "/api/refresh":
                # Force cache refresh
                cache.clear()
                all_ads = fetch_all_competitors(5)
                self.respond(200, {
                    "status": "refreshed",
                    "ads_count": len(all_ads),
                })

            else:
                self.respond(404, {"error": "Not found"})

        except Exception as e:
            traceback.print_exc()
            self.respond(500, {"error": str(e)})

    def respond(self, code, data):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data, default=str).encode())

    def log_message(self, format, *args):
        print(f"[GoogleTransparency] {args[0]}")


if __name__ == "__main__":
    port = 3201
    server = HTTPServer(("127.0.0.1", port), Handler)
    print(f"Google Ads Transparency API running on http://127.0.0.1:{port}")
    server.serve_forever()
