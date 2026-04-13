import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { events } = await request.json();
    if (!Array.isArray(events) || events.length === 0) {
      return new NextResponse(null, { status: 204 });
    }

    for (const e of events) {
      if (!e.recommendationId || !e.event) continue;

      try {
        // Check if recommendation exists in DB
        const recExists = await db.flywhRecommendation.findUnique({
          where: { id: e.recommendationId },
          select: { id: true },
        });

        if (recExists) {
          // Create user action linked to recommendation
          await db.flywhUserAction.create({
            data: {
              recommendationId: e.recommendationId,
              userId: null,
              action: e.event,
              dwellTimeMs: e.dwellTimeMs ?? null,
              editPayload: e.editPayload ?? undefined,
              sessionId: e.sessionId ?? null,
              createdAt: new Date(e.timestamp || Date.now()),
            },
          });

          // Update recommendation status
          if (e.event === "recommendation_approved") {
            await db.flywhRecommendation.update({
              where: { id: e.recommendationId },
              data: { status: "approved" },
            });
          } else if (e.event === "recommendation_skipped") {
            await db.flywhRecommendation.update({
              where: { id: e.recommendationId },
              data: { status: "skipped" },
            });
          } else if (e.event === "recommendation_viewed" || e.event === "recommendation_expanded") {
            // Only update to viewed if still pending
            await db.flywhRecommendation.updateMany({
              where: { id: e.recommendationId, status: "pending" },
              data: { status: "viewed" },
            });
          }
        }
        // If rec doesn't exist, silently skip — it may not have been persisted yet
      } catch {
        // Skip — tracking should never break
      }
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
