import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";

// ============================================================
// FEEDBACK DATA
// ============================================================

interface FeedbackEntry {
  recId: string;
  productId: string;
  action: "approve" | "skip" | "remove" | "add_manual";
  reason?: string;
  timestamp: string;
}

interface FeedbackData {
  feedback: FeedbackEntry[];
}

const FEEDBACK_FILE = path.join(process.cwd(), "data", "product-feedback.json");

function loadFeedback(): FeedbackData {
  if (!existsSync(FEEDBACK_FILE)) {
    return { feedback: [] };
  }
  try {
    const raw = readFileSync(FEEDBACK_FILE, "utf-8");
    return JSON.parse(raw) as FeedbackData;
  } catch {
    return { feedback: [] };
  }
}

function saveFeedback(data: FeedbackData): void {
  writeFileSync(FEEDBACK_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// ============================================================
// API HANDLERS
// ============================================================

export async function GET() {
  try {
    const data = loadFeedback();
    return NextResponse.json({
      total: data.feedback.length,
      feedback: data.feedback,
    });
  } catch (error) {
    console.error("Feedback GET error:", error);
    return NextResponse.json(
      { error: "Failed to load feedback", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.recommendationId || !body.productId || !body.action) {
      return NextResponse.json(
        { error: "Missing required fields: recommendationId, productId, action" },
        { status: 400 }
      );
    }

    const validActions = ["approve", "skip", "remove", "add_manual"];
    if (!validActions.includes(body.action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be one of: " + validActions.join(", ") },
        { status: 400 }
      );
    }

    const entry: FeedbackEntry = {
      recId: body.recommendationId,
      productId: body.productId,
      action: body.action,
      reason: body.reason || undefined,
      timestamp: new Date().toISOString(),
    };

    const data = loadFeedback();
    data.feedback.push(entry);
    saveFeedback(data);

    return NextResponse.json({
      success: true,
      entry,
      totalFeedback: data.feedback.length,
    });
  } catch (error) {
    console.error("Feedback POST error:", error);
    return NextResponse.json(
      { error: "Failed to save feedback", details: String(error) },
      { status: 500 }
    );
  }
}
