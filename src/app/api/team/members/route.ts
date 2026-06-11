import { NextResponse } from "next/server";
import { requireTeamAccess } from "@/lib/team/api-auth";
import { getTeamPageData } from "@/lib/team/service";

export async function GET() {
  const access = await requireTeamAccess();

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  try {
    const data = await getTeamPageData(access.context);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to load team members", error);
    return NextResponse.json(
      { error: "Could not fetch team data" },
      { status: 500 },
    );
  }
}
