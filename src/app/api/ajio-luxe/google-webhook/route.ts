import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = "/root/luxe-ai/data";
const WEBHOOK_SECRET = "ajio-luxe-gads-2026";

/**
 * POST /api/ajio-luxe/google-webhook
 * Receives campaign performance data pushed from Google Ads Scripts.
 */
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Ensure data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });

    // Save the data with timestamp
    const filename = `ajio-luxe-google-ads-${new Date().toISOString().split("T")[0]}.json`;
    const filepath = path.join(DATA_DIR, filename);

    await fs.writeFile(filepath, JSON.stringify(body, null, 2));

    // Also save as latest
    await fs.writeFile(
      path.join(DATA_DIR, "ajio-luxe-google-ads-latest.json"),
      JSON.stringify(body, null, 2)
    );

    return NextResponse.json({
      success: true,
      message: `Received ${body.campaigns?.length || 0} campaigns`,
      savedAs: filename,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * GET /api/ajio-luxe/google-webhook
 * Returns the latest Google Ads data received from the script.
 */
export async function GET() {
  try {
    const filepath = path.join(DATA_DIR, "ajio-luxe-google-ads-latest.json");
    const data = await fs.readFile(filepath, "utf-8");
    return NextResponse.json(JSON.parse(data));
  } catch {
    return NextResponse.json({
      error: "No Google Ads data yet. Run the Google Ads Script to push data.",
      campaigns: [],
      summary: null,
    });
  }
}
