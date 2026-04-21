#!/usr/bin/env python3
"""
Import breakdown metrics from Meta JSON + Google CSV files into the BreakdownMetric table.
Creates the table via raw SQL (not Prisma-managed).
"""

import json
import csv
import uuid
import os
import psycopg2
from psycopg2.extras import execute_values

DB_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/luxeai")

DATA_DIR = "/root/luxe-ai/data"
META_DIR = f"{DATA_DIR}/meta-full"

def connect():
    return psycopg2.connect(DB_URL)

def create_table(cur):
    cur.execute('''
        CREATE TABLE IF NOT EXISTS "BreakdownMetric" (
            id TEXT PRIMARY KEY,
            platform TEXT NOT NULL,
            dimension TEXT NOT NULL,
            "dimensionValue" TEXT NOT NULL,
            "campaignName" TEXT,
            spend FLOAT DEFAULT 0,
            impressions BIGINT DEFAULT 0,
            clicks BIGINT DEFAULT 0,
            conversions FLOAT DEFAULT 0,
            revenue FLOAT DEFAULT 0,
            roas FLOAT,
            cpa FLOAT,
            ctr FLOAT,
            "dateStart" TEXT,
            "dateEnd" TEXT,
            "createdAt" TIMESTAMP DEFAULT NOW()
        );
    ''')
    cur.execute('CREATE INDEX IF NOT EXISTS idx_breakdown_dim ON "BreakdownMetric"(dimension, "dimensionValue");')
    cur.execute('CREATE INDEX IF NOT EXISTS idx_breakdown_platform ON "BreakdownMetric"(platform);')
    print("[OK] Table BreakdownMetric created/verified")

def clear_table(cur):
    cur.execute('DELETE FROM "BreakdownMetric";')
    print("[OK] Cleared existing data")

def parse_purchases(actions):
    """Extract purchase count from Meta actions array."""
    if not actions:
        return 0
    for a in actions:
        if a.get("action_type") == "purchase":
            return float(a["value"])
        if a.get("action_type") == "omni_purchase":
            return float(a["value"])
    return 0

def parse_roas_value(purchase_roas):
    """Extract ROAS from Meta purchase_roas field (list of dicts)."""
    if not purchase_roas:
        return None
    if isinstance(purchase_roas, list):
        for r in purchase_roas:
            if r.get("action_type") == "omni_purchase":
                return float(r["value"])
        if purchase_roas:
            return float(purchase_roas[0].get("value", 0))
    return None

def safe_float(v, default=0):
    if v is None or v == "":
        return default
    try:
        return float(str(v).replace(",", ""))
    except:
        return default

def safe_int(v, default=0):
    if v is None or v == "":
        return default
    try:
        return int(float(str(v).replace(",", "")))
    except:
        return default

def compute_derived(spend, impressions, clicks, conversions, revenue=0):
    ctr = (clicks / impressions * 100) if impressions > 0 else None
    cpa = (spend / conversions) if conversions > 0 else None
    roas = (revenue / spend) if spend > 0 and revenue > 0 else None
    return ctr, cpa, roas

def build_row(platform, dimension, dim_value, campaign, spend, impressions, clicks, conversions, revenue, roas_override, date_start, date_end):
    ctr, cpa, roas = compute_derived(spend, impressions, clicks, conversions, revenue)
    if roas_override is not None:
        roas = roas_override
    return (
        str(uuid.uuid4()),
        platform,
        dimension,
        dim_value,
        campaign,
        spend,
        impressions,
        clicks,
        conversions,
        revenue,
        roas,
        cpa,
        ctr,
        date_start,
        date_end,
    )

def insert_rows(cur, rows):
    if not rows:
        return 0
    sql = '''
        INSERT INTO "BreakdownMetric" 
        (id, platform, dimension, "dimensionValue", "campaignName", spend, impressions, clicks, conversions, revenue, roas, cpa, ctr, "dateStart", "dateEnd")
        VALUES %s
    '''
    execute_values(cur, sql, rows, page_size=500)
    return len(rows)

# ─── META IMPORTERS ────────────────────────────────────────

def import_meta_age_gender(cur):
    data = json.load(open(f"{META_DIR}/14-age-gender.json"))
    rows = []
    for r in data:
        spend = safe_float(r.get("spend"))
        impressions = safe_int(r.get("impressions"))
        clicks = safe_int(r.get("clicks"))
        conversions = parse_purchases(r.get("actions"))
        campaign = r.get("campaign_name")
        ds = r.get("date_start")
        de = r.get("date_stop")

        # Age row
        age = r.get("age", "Unknown")
        rows.append(build_row("meta", "age", age, campaign, spend, impressions, clicks, conversions, 0, None, ds, de))

        # Gender row
        gender = r.get("gender", "unknown")
        rows.append(build_row("meta", "gender", gender, campaign, spend, impressions, clicks, conversions, 0, None, ds, de))

    count = insert_rows(cur, rows)
    print(f"[OK] Meta age-gender: {count} rows ({len(data)} source records)")

def import_meta_device_platform(cur):
    data = json.load(open(f"{META_DIR}/11-device-platform.json"))
    rows = []
    for r in data:
        spend = safe_float(r.get("spend"))
        impressions = safe_int(r.get("impressions"))
        clicks = safe_int(r.get("clicks"))
        conversions = parse_purchases(r.get("actions"))
        ds = r.get("date_start")
        de = r.get("date_stop")

        device = r.get("device_platform", "unknown")
        rows.append(build_row("meta", "device", device, None, spend, impressions, clicks, conversions, 0, None, ds, de))

        publisher = r.get("publisher_platform", "unknown")
        rows.append(build_row("meta", "publisher", publisher, None, spend, impressions, clicks, conversions, 0, None, ds, de))

    count = insert_rows(cur, rows)
    print(f"[OK] Meta device-platform: {count} rows ({len(data)} source records)")

def import_meta_placements(cur):
    data = json.load(open(f"{META_DIR}/12-placements.json"))
    rows = []
    for r in data:
        spend = safe_float(r.get("spend"))
        impressions = safe_int(r.get("impressions"))
        clicks = safe_int(r.get("clicks"))
        conversions = parse_purchases(r.get("actions"))
        roas_val = parse_roas_value(r.get("purchase_roas"))
        ds = r.get("date_start")
        de = r.get("date_stop")

        publisher = r.get("publisher_platform", "unknown")
        position = r.get("platform_position", "unknown")
        # Combine as "publisher_position" e.g. "instagram_reels"
        placement = f"{publisher}_{position}" if position != "unknown" else publisher
        rows.append(build_row("meta", "placement", placement, None, spend, impressions, clicks, conversions, 0, roas_val, ds, de))

    count = insert_rows(cur, rows)
    print(f"[OK] Meta placements: {count} rows ({len(data)} source records)")

def import_meta_region(cur):
    data = json.load(open(f"{META_DIR}/10-region.json"))
    rows = []
    for r in data:
        spend = safe_float(r.get("spend"))
        impressions = safe_int(r.get("impressions"))
        clicks = safe_int(r.get("clicks"))
        conversions = parse_purchases(r.get("actions"))
        ds = r.get("date_start")
        de = r.get("date_stop")
        region = r.get("region", "Unknown")
        # Clean region name
        region = region.strip().strip("'\"")
        rows.append(build_row("meta", "region", region, None, spend, impressions, clicks, conversions, 0, None, ds, de))

    count = insert_rows(cur, rows)
    print(f"[OK] Meta region: {count} rows ({len(data)} source records)")

# ─── GOOGLE IMPORTERS ──────────────────────────────────────

def read_google_csv(filepath):
    """Read Google CSV: skip rows 1-2, row 3 is header."""
    with open(filepath, "r", encoding="utf-8-sig") as f:
        # Skip first 2 lines (title + date range)
        next(f)
        next(f)
        reader = csv.DictReader(f)
        rows = []
        for r in reader:
            # Skip summary/total rows
            campaign = r.get("Campaign", "")
            if not campaign or campaign.lower() == "total":
                continue
            rows.append(r)
    return rows

def import_google_age_gender(cur):
    data = read_google_csv(f"{DATA_DIR}/ajio-luxe-google-age-gender.csv")
    rows = []
    for r in data:
        campaign = r.get("Campaign", "")
        spend = safe_float(r.get("Cost"))
        impressions = safe_int(r.get("Impr."))
        clicks = safe_int(r.get("Clicks"))
        conversions = safe_float(r.get("Conversions"))

        gender = r.get("Gender", "Unknown")
        age = r.get("Age", "Unknown")

        rows.append(build_row("google", "age", age, campaign, spend, impressions, clicks, conversions, 0, None, None, None))
        rows.append(build_row("google", "gender", gender, campaign, spend, impressions, clicks, conversions, 0, None, None, None))

    count = insert_rows(cur, rows)
    print(f"[OK] Google age-gender: {count} rows ({len(data)} source records)")

def import_google_device(cur):
    data = read_google_csv(f"{DATA_DIR}/ajio-luxe-google-device.csv")
    rows = []
    for r in data:
        campaign = r.get("Campaign", "")
        spend = safe_float(r.get("Cost"))
        impressions = safe_int(r.get("Impr."))
        clicks = safe_int(r.get("Clicks"))
        conversions = safe_float(r.get("Conversions"))
        device = r.get("Ad device preference type", r.get("Device", "Unknown"))

        rows.append(build_row("google", "device", device, campaign, spend, impressions, clicks, conversions, 0, None, None, None))

    count = insert_rows(cur, rows)
    print(f"[OK] Google device: {count} rows ({len(data)} source records)")

def import_google_location(cur):
    data = read_google_csv(f"{DATA_DIR}/ajio-luxe-google-location.csv")
    rows = []
    for r in data:
        campaign = r.get("Campaign", "")
        spend = safe_float(r.get("Cost"))
        impressions = safe_int(r.get("Impr."))
        clicks = safe_int(r.get("Clicks"))
        conversions = safe_float(r.get("Conversions"))
        region = r.get("Region (User location)", r.get("Region", "Unknown"))

        rows.append(build_row("google", "region", region, campaign, spend, impressions, clicks, conversions, 0, None, None, None))

    count = insert_rows(cur, rows)
    print(f"[OK] Google location: {count} rows ({len(data)} source records)")

# ─── MAIN ──────────────────────────────────────────────────

def main():
    conn = connect()
    cur = conn.cursor()

    print("=== Creating table ===")
    create_table(cur)
    conn.commit()

    print("\n=== Clearing old data ===")
    clear_table(cur)
    conn.commit()

    print("\n=== Importing Meta data ===")
    import_meta_age_gender(cur)
    import_meta_device_platform(cur)
    import_meta_placements(cur)
    import_meta_region(cur)
    conn.commit()

    print("\n=== Importing Google data ===")
    import_google_age_gender(cur)
    import_google_device(cur)
    import_google_location(cur)
    conn.commit()

    # Summary
    cur.execute('SELECT dimension, COUNT(*), SUM(spend), SUM(conversions) FROM "BreakdownMetric" GROUP BY dimension ORDER BY dimension;')
    print("\n=== Summary ===")
    for row in cur.fetchall():
        print(f"  {row[0]}: {row[1]} rows, spend={row[2]:.0f}, conversions={row[3]:.0f}")

    cur.execute('SELECT COUNT(*) FROM "BreakdownMetric";')
    total = cur.fetchone()[0]
    print(f"\n  TOTAL: {total} rows")

    cur.close()
    conn.close()
    print("\n[DONE] Import complete!")

if __name__ == "__main__":
    main()
