import { NextResponse } from "next/server";
import { runAnalyticsInsightsCron } from "@/lib/analytics/insights/cron";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return process.env.NODE_ENV === "development";
  }

  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runAnalyticsInsightsCron();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[cron/analytics-insights] failed", error);
    return NextResponse.json(
      { error: "Failed to refresh analytics insights" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
