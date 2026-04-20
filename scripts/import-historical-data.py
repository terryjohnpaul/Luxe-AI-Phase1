#!/usr/bin/env python3
"""
Import historical Meta and Google Ads data into LUXE AI PostgreSQL database.
"""

import json
import csv
import uuid
import re
import sys
from datetime import datetime, date
from calendar import monthrange

import psycopg2
from psycopg2.extras import execute_values

# ── Config ──────────────────────────────────────────────────────────────
DB_CONFIG = dict(host="localhost", dbname="luxeai", user="postgres", password="postgres")
ORG_ID = "org_ajio_luxe"
META_ADACC = "adacc_meta_ajio"
GOOGLE_ADACC = "adacc_google_ajio"

DATA_DIR = "/root/luxe-ai/data"

def cuid():
    return "c" + uuid.uuid4().hex[:24]

def safe_int(v):
    if v is None or v == "" or v == "--":
        return 0
    s = str(v).replace(",", "").replace("%", "").strip()
    try:
        return int(float(s))
    except (ValueError, TypeError):
        return 0

def safe_float(v):
    if v is None or v == "" or v == "--":
        return 0.0
    s = str(v).replace(",", "").replace("%", "").replace("₹", "").replace("$", "").strip()
    try:
        return float(s)
    except (ValueError, TypeError):
        return 0.0

def safe_float_or_none(v):
    if v is None or v == "" or v == "--":
        return None
    s = str(v).replace(",", "").replace("%", "").strip()
    try:
        f = float(s)
        return f if f != 0 else None
    except (ValueError, TypeError):
        return None

def get_action_value(actions, *action_types):
    """Extract value from Meta actions array for given action_types."""
    if not actions:
        return 0
    for a in actions:
        if a.get("action_type") in action_types:
            return safe_float(a.get("value", 0))
    return 0

def month_start_end(date_start_str):
    """Given a date string, return (first_day, last_day) of that month."""
    d = datetime.strptime(date_start_str, "%Y-%m-%d").date()
    first = d.replace(day=1)
    _, last_day = monthrange(d.year, d.month)
    last = d.replace(day=last_day)
    return first, last

def parse_google_month(month_str):
    """Parse 'June 2025' -> (date(2025,6,1), date(2025,6,30))"""
    d = datetime.strptime(month_str.strip(), "%B %Y")
    first = d.date().replace(day=1)
    _, last_day = monthrange(d.year, d.month)
    last = first.replace(day=last_day)
    return first, last

def map_google_status(s):
    s = s.strip().lower() if s else ""
    if s == "enabled":
        return "ACTIVE"
    elif s == "paused":
        return "PAUSED"
    elif s in ("removed", "deleted"):
        return "DELETED"
    return "PAUSED"

def map_google_campaign_type(s):
    s = s.strip().lower() if s else ""
    mapping = {
        "performance max": "PMAX",
        "search": "SEARCH",
        "shopping": "SHOPPING",
        "display": "DISPLAY",
        "video": "VIDEO",
        "demand gen": "DEMAND_GEN",
        "app": "APP",
        "discovery": "DISCOVERY",
        "smart": "SMART",
    }
    return mapping.get(s, s.upper() if s else None)

def infer_meta_campaign_type(name):
    """Infer campaign type from Meta campaign name."""
    n = name.lower()
    if "asc" in n or "advantage" in n:
        return "ASC"
    elif "catalog" in n or "dpa" in n:
        return "CATALOG"
    elif "retarget" in n or "remarket" in n:
        return "RETARGETING"
    elif "traffic" in n:
        return "TRAFFIC"
    elif "conv" in n:
        return "CONVERSIONS"
    elif "reach" in n:
        return "REACH"
    elif "engage" in n:
        return "ENGAGEMENT"
    elif "video" in n or "reel" in n:
        return "VIDEO"
    elif "brand" in n or "awareness" in n:
        return "AWARENESS"
    elif "lead" in n:
        return "LEADS"
    elif "demgen" in n or "dem_gen" in n:
        return "DEMAND_GEN"
    return None

def map_meta_status(s):
    s = (s or "").upper()
    if s == "ACTIVE":
        return "ACTIVE"
    elif s == "PAUSED":
        return "PAUSED"
    elif s == "DELETED":
        return "DELETED"
    elif s == "ARCHIVED":
        return "ARCHIVED"
    return "PAUSED"


def main():
    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = False
    cur = conn.cursor()

    print("=" * 60)
    print("LUXE AI Historical Data Import")
    print("=" * 60)

    # ── 1. Create Google AdAccount ──────────────────────────────────
    print("\n[1] Creating Google AdAccount...")
    cur.execute("""
        INSERT INTO "AdAccount" (id, platform, "accountId", name, "isActive", "organizationId", "createdAt", "updatedAt")
        VALUES (%s, 'GOOGLE', %s, %s, true, %s, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
    """, (GOOGLE_ADACC, "864-160-4012", "Ajio Luxe Google", ORG_ID))
    conn.commit()
    print("   Google AdAccount created/exists.")

    # ── 2. Load Meta campaigns from 01-campaigns.json ───────────────
    print("\n[2] Loading Meta campaigns...")
    with open(f"{DATA_DIR}/meta-full/01-campaigns.json") as f:
        meta_campaigns_raw = json.load(f)

    # Build lookup: campaign_id -> campaign info
    meta_campaign_info = {}
    for c in meta_campaigns_raw:
        meta_campaign_info[c["id"]] = {
            "name": c["name"],
            "status": map_meta_status(c.get("status")),
            "objective": c.get("objective"),
        }

    # ── 3. Load Meta campaign insights (18) for campaign-level data ──
    print("[3] Loading Meta campaign insights (18-campaign-insights-full.json)...")
    with open(f"{DATA_DIR}/meta-full/18-campaign-insights-full.json") as f:
        meta_insights = json.load(f)

    # Collect unique Meta campaigns from insights
    meta_campaigns = {}  # campaign_id -> campaign row dict
    for row in meta_insights:
        cid = row["campaign_id"]
        if cid not in meta_campaigns:
            info = meta_campaign_info.get(cid, {})
            meta_campaigns[cid] = {
                "id": cuid(),
                "externalId": cid,
                "platform": "META",
                "name": row.get("campaign_name", info.get("name", f"Meta Campaign {cid}")),
                "status": info.get("status", "PAUSED"),
                "campaignType": infer_meta_campaign_type(row.get("campaign_name", "")),
                "objective": info.get("objective"),
                "adAccountId": META_ADACC,
                "organizationId": ORG_ID,
            }

    # Also add campaigns from 01-campaigns that may not appear in insights
    for cid, info in meta_campaign_info.items():
        if cid not in meta_campaigns:
            meta_campaigns[cid] = {
                "id": cuid(),
                "externalId": cid,
                "platform": "META",
                "name": info["name"],
                "status": info.get("status", "PAUSED"),
                "campaignType": infer_meta_campaign_type(info["name"]),
                "objective": info.get("objective"),
                "adAccountId": META_ADACC,
                "organizationId": ORG_ID,
            }

    print(f"   Found {len(meta_campaigns)} unique Meta campaigns.")

    # ── 4. Load Google campaigns ────────────────────────────────────
    print("[4] Loading Google campaigns from alltime CSV...")
    google_campaigns = {}  # campaign_name -> campaign row dict

    with open(f"{DATA_DIR}/ajio-luxe-google-ads-alltime.csv", "r") as f:
        # Skip first 2 rows (report title)
        next(f)
        next(f)
        reader = csv.DictReader(f)
        for row in reader:
            cname = row.get("Campaign", "").strip()
            if not cname or cname.startswith("Total"):
                continue
            if cname not in google_campaigns:
                status_raw = row.get("Campaign status", row.get("Status", "")).strip()
                ctype_raw = row.get("Campaign type", "").strip()
                budget = safe_float_or_none(row.get("Budget", ""))
                google_campaigns[cname] = {
                    "id": cuid(),
                    "externalId": cname,
                    "platform": "GOOGLE",
                    "name": cname,
                    "status": map_google_status(status_raw),
                    "campaignType": map_google_campaign_type(ctype_raw),
                    "dailyBudget": budget,
                    "adAccountId": GOOGLE_ADACC,
                    "organizationId": ORG_ID,
                }

    print(f"   Found {len(google_campaigns)} unique Google campaigns.")

    # ── 5. Insert all campaigns ─────────────────────────────────────
    print("\n[5] Inserting campaigns into database...")
    all_campaigns = list(meta_campaigns.values()) + list(google_campaigns.values())
    inserted_campaigns = 0
    skipped_campaigns = 0

    for c in all_campaigns:
        try:
            cur.execute("""
                INSERT INTO "Campaign" (
                    id, "externalId", platform, name, status, "campaignType",
                    "dailyBudget", objective, "adAccountId", "organizationId",
                    "createdAt", "updatedAt"
                ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s, NOW(), NOW())
                ON CONFLICT (platform, "externalId") DO NOTHING
            """, (
                c["id"], c["externalId"], c["platform"], c["name"],
                c["status"], c.get("campaignType"), c.get("dailyBudget"),
                c.get("objective"), c["adAccountId"], c["organizationId"],
            ))
            if cur.rowcount > 0:
                inserted_campaigns += 1
            else:
                skipped_campaigns += 1
        except Exception as e:
            conn.rollback()
            print(f"   ERROR inserting campaign {c['name']}: {e}")
            continue

    conn.commit()
    print(f"   Inserted: {inserted_campaigns}, Skipped (duplicate): {skipped_campaigns}")

    # Build lookup for campaignId by (platform, externalId)
    cur.execute('SELECT id, platform, "externalId" FROM "Campaign"')
    campaign_lookup = {}
    for row in cur.fetchall():
        campaign_lookup[(row[1], row[2])] = row[0]

    # ── 6. Import Meta CampaignMetrics (monthly-by-campaign) ────────
    print("\n[6] Importing Meta CampaignMetrics from 15-monthly-by-campaign.json...")
    with open(f"{DATA_DIR}/meta-full/15-monthly-by-campaign.json") as f:
        meta_monthly = json.load(f)

    meta_metrics = []
    for row in meta_monthly:
        cid = row["campaign_id"]
        db_campaign_id = campaign_lookup.get(("META", cid))
        if not db_campaign_id:
            continue

        impressions = safe_int(row.get("impressions", 0))
        clicks = safe_int(row.get("clicks", 0))
        spend = safe_float(row.get("spend", 0))

        actions = row.get("actions", [])
        purchases = get_action_value(actions, "purchase", "omni_purchase")
        atc = get_action_value(actions, "add_to_cart")

        # Revenue: use purchase_roas * spend
        purchase_roas_data = row.get("purchase_roas", [])
        roas_val = None
        revenue = 0.0
        if purchase_roas_data:
            for pr in purchase_roas_data:
                if pr.get("action_type") in ("omni_purchase", "purchase"):
                    roas_val = safe_float(pr.get("value", 0))
                    revenue = roas_val * spend
                    break

        ctr = safe_float_or_none(row.get("ctr"))
        if ctr:
            ctr = ctr / 100.0 if ctr > 1 else ctr
        cpc = spend / clicks if clicks > 0 else None
        cpa = spend / purchases if purchases > 0 else None

        date_start = row["date_start"]
        month_first, _ = month_start_end(date_start)

        meta_metrics.append((
            cuid(), db_campaign_id, META_ADACC, month_first,
            impressions, clicks, spend, int(purchases), revenue,
            ctr, cpc, cpa, roas_val,
            None, None,  # frequency, reach (not in monthly-by-campaign)
            None, safe_int(atc), int(purchases),  # videoViews, addToCart, purchases
            "META",
        ))

    print(f"   Prepared {len(meta_metrics)} Meta metric rows.")

    inserted_metrics = 0
    skipped_metrics = 0
    for m in meta_metrics:
        try:
            cur.execute("""
                INSERT INTO "CampaignMetric" (
                    id, "campaignId", "adAccountId", date,
                    impressions, clicks, spend, conversions, "conversionValue",
                    ctr, cpc, cpa, roas,
                    frequency, reach,
                    "videoViews", "addToCart", purchases,
                    platform, "createdAt"
                ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW())
                ON CONFLICT ("campaignId", date) DO NOTHING
            """, m)
            if cur.rowcount > 0:
                inserted_metrics += 1
            else:
                skipped_metrics += 1
        except Exception as e:
            conn.rollback()
            print(f"   ERROR metric: {e}")
    conn.commit()
    print(f"   Meta metrics inserted: {inserted_metrics}, skipped: {skipped_metrics}")

    # ── 7. Import Google CampaignMetrics (monthly CSV) ──────────────
    print("\n[7] Importing Google CampaignMetrics from monthly CSV...")
    google_metrics = []

    with open(f"{DATA_DIR}/ajio-luxe-google-ads-monthly.csv", "r") as f:
        next(f)  # skip row 1
        next(f)  # skip row 2
        reader = csv.DictReader(f)
        for row in reader:
            cname = row.get("Campaign", "").strip()
            if not cname or cname.startswith("Total"):
                continue

            month_str = row.get("Month", "").strip()
            if not month_str:
                continue
            try:
                month_first, _ = parse_google_month(month_str)
            except ValueError:
                continue

            db_campaign_id = campaign_lookup.get(("GOOGLE", cname))
            if not db_campaign_id:
                continue

            impressions = safe_int(row.get("Impr.", 0))
            clicks = safe_int(row.get("Clicks", 0))
            spend = safe_float(row.get("Cost", 0))
            conversions = safe_float(row.get("Conversions", 0))
            conv_value = safe_float(row.get("Conv. value", 0))
            view_through = safe_float(row.get("View-through conv.", 0))

            ctr_raw = row.get("CTR", "")
            ctr = safe_float_or_none(ctr_raw)
            if ctr and ctr > 1:
                ctr = ctr / 100.0

            cpc = safe_float_or_none(row.get("Avg. CPC", ""))
            cpa = spend / conversions if conversions > 0 else None
            roas = conv_value / spend if spend > 0 else None

            google_metrics.append((
                cuid(), db_campaign_id, GOOGLE_ADACC, month_first,
                impressions, clicks, spend, int(conversions), conv_value,
                ctr, cpc, cpa, roas,
                None, None,  # frequency, reach
                None, None, int(conversions),  # videoViews, addToCart, purchases
                "GOOGLE",
            ))

    print(f"   Prepared {len(google_metrics)} Google metric rows.")

    inserted_g_metrics = 0
    skipped_g_metrics = 0
    for m in google_metrics:
        try:
            cur.execute("""
                INSERT INTO "CampaignMetric" (
                    id, "campaignId", "adAccountId", date,
                    impressions, clicks, spend, conversions, "conversionValue",
                    ctr, cpc, cpa, roas,
                    frequency, reach,
                    "videoViews", "addToCart", purchases,
                    platform, "createdAt"
                ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW())
                ON CONFLICT ("campaignId", date) DO NOTHING
            """, m)
            if cur.rowcount > 0:
                inserted_g_metrics += 1
            else:
                skipped_g_metrics += 1
        except Exception as e:
            conn.rollback()
            print(f"   ERROR google metric: {e}")
    conn.commit()
    print(f"   Google metrics inserted: {inserted_g_metrics}, skipped: {skipped_g_metrics}")

    # ── 8. Import CampaignOutcome (Meta monthly by campaign) ────────
    print("\n[8] Importing Meta CampaignOutcome rows...")
    meta_outcomes = []
    for row in meta_monthly:
        cid = row["campaign_id"]
        impressions = safe_int(row.get("impressions", 0))
        clicks = safe_int(row.get("clicks", 0))
        spend = safe_float(row.get("spend", 0))
        actions = row.get("actions", [])
        purchases = get_action_value(actions, "purchase", "omni_purchase")

        purchase_roas_data = row.get("purchase_roas", [])
        roas_val = None
        revenue = 0.0
        if purchase_roas_data:
            for pr in purchase_roas_data:
                if pr.get("action_type") in ("omni_purchase", "purchase"):
                    roas_val = safe_float(pr.get("value", 0))
                    revenue = roas_val * spend
                    break

        ctr = clicks / impressions if impressions > 0 else None
        cpa = spend / purchases if purchases > 0 else None

        date_start = row["date_start"]
        date_end = row["date_stop"]

        meta_outcomes.append((
            cuid(), "meta", cid,
            date_start, date_end,
            impressions, clicks, spend,
            purchases, revenue,
            ctr, roas_val, cpa,
            ORG_ID,
        ))

    inserted_outcomes = 0
    for o in meta_outcomes:
        try:
            cur.execute("""
                INSERT INTO "CampaignOutcome" (
                    id, platform, "externalCampaignId",
                    "dateStart", "dateEnd",
                    impressions, clicks, spend,
                    conversions, revenue,
                    ctr, roas, cpa,
                    "organizationId", "fetchedAt"
                ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW())
            """, o)
            inserted_outcomes += 1
        except Exception as e:
            conn.rollback()
            print(f"   ERROR meta outcome: {e}")
    conn.commit()
    print(f"   Meta outcomes inserted: {inserted_outcomes}")

    # ── 9. Import CampaignOutcome (Google monthly) ──────────────────
    print("[9] Importing Google CampaignOutcome rows...")
    google_outcomes = []

    with open(f"{DATA_DIR}/ajio-luxe-google-ads-monthly.csv", "r") as f:
        next(f)
        next(f)
        reader = csv.DictReader(f)
        for row in reader:
            cname = row.get("Campaign", "").strip()
            if not cname or cname.startswith("Total"):
                continue
            month_str = row.get("Month", "").strip()
            if not month_str:
                continue
            try:
                month_first, month_last = parse_google_month(month_str)
            except ValueError:
                continue

            impressions = safe_int(row.get("Impr.", 0))
            clicks = safe_int(row.get("Clicks", 0))
            spend = safe_float(row.get("Cost", 0))
            conversions = safe_float(row.get("Conversions", 0))
            conv_value = safe_float(row.get("Conv. value", 0))

            ctr = clicks / impressions if impressions > 0 else None
            roas = conv_value / spend if spend > 0 else None
            cpa = spend / conversions if conversions > 0 else None

            google_outcomes.append((
                cuid(), "google", cname,
                str(month_first), str(month_last),
                impressions, clicks, spend,
                conversions, conv_value,
                ctr, roas, cpa,
                ORG_ID,
            ))

    inserted_g_outcomes = 0
    for o in google_outcomes:
        try:
            cur.execute("""
                INSERT INTO "CampaignOutcome" (
                    id, platform, "externalCampaignId",
                    "dateStart", "dateEnd",
                    impressions, clicks, spend,
                    conversions, revenue,
                    ctr, roas, cpa,
                    "organizationId", "fetchedAt"
                ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW())
            """, o)
            inserted_g_outcomes += 1
        except Exception as e:
            conn.rollback()
            print(f"   ERROR google outcome: {e}")
    conn.commit()
    print(f"   Google outcomes inserted: {inserted_g_outcomes}")

    # ── 10. Summary ─────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("IMPORT SUMMARY")
    print("=" * 60)

    cur.execute('SELECT COUNT(*) FROM "Campaign" WHERE platform = \'META\'')
    meta_c = cur.fetchone()[0]
    cur.execute('SELECT COUNT(*) FROM "Campaign" WHERE platform = \'GOOGLE\'')
    google_c = cur.fetchone()[0]
    cur.execute('SELECT COUNT(*) FROM "CampaignMetric" WHERE platform = \'META\'')
    meta_m = cur.fetchone()[0]
    cur.execute('SELECT COUNT(*) FROM "CampaignMetric" WHERE platform = \'GOOGLE\'')
    google_m = cur.fetchone()[0]
    cur.execute('SELECT COUNT(*) FROM "CampaignOutcome" WHERE platform = \'meta\'')
    meta_o = cur.fetchone()[0]
    cur.execute('SELECT COUNT(*) FROM "CampaignOutcome" WHERE platform = \'google\'')
    google_o = cur.fetchone()[0]

    cur.execute('SELECT MIN(date), MAX(date) FROM "CampaignMetric"')
    date_range = cur.fetchone()
    cur.execute('SELECT SUM(spend) FROM "CampaignMetric" WHERE platform = \'META\'')
    meta_spend = cur.fetchone()[0] or 0
    cur.execute('SELECT SUM(spend) FROM "CampaignMetric" WHERE platform = \'GOOGLE\'')
    google_spend = cur.fetchone()[0] or 0

    print(f"\n  Campaigns:")
    print(f"    Meta:   {meta_c}")
    print(f"    Google: {google_c}")
    print(f"    Total:  {meta_c + google_c}")
    print(f"\n  Campaign Metrics:")
    print(f"    Meta:   {meta_m}")
    print(f"    Google: {google_m}")
    print(f"    Total:  {meta_m + google_m}")
    print(f"    Date range: {date_range[0]} to {date_range[1]}")
    print(f"\n  Campaign Outcomes:")
    print(f"    Meta:   {meta_o}")
    print(f"    Google: {google_o}")
    print(f"    Total:  {meta_o + google_o}")
    print(f"\n  Total Spend Tracked:")
    print(f"    Meta:   INR {meta_spend:,.2f}")
    print(f"    Google: INR {google_spend:,.2f}")
    print(f"    Total:  INR {meta_spend + google_spend:,.2f}")

    cur.close()
    conn.close()
    print("\nDone!")


if __name__ == "__main__":
    main()
