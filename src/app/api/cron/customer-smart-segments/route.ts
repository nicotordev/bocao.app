import { NextResponse } from "next/server";
import { runCustomerSmartSegmentsCron } from "@/lib/customers/smart-segments/cron";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error("[cron/customer-smart-segments] CRON_SECRET is not configured");
    return false;
  }

  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runCustomerSmartSegmentsCron();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[cron/customer-smart-segments] failed", error);
    return NextResponse.json(
      { error: "Failed to refresh customer smart segments" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
