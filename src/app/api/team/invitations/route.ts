import { NextResponse } from "next/server";
import { requireTeamAccess } from "@/lib/team/api-auth";
import { inviteMemberBodySchema } from "@/lib/team/schema";
import { inviteTeamMember, TeamServiceError } from "@/lib/team/service";

export async function POST(request: Request) {
  const access = await requireTeamAccess();

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = inviteMemberBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  try {
    const result = await inviteTeamMember(access.context, parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof TeamServiceError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }

    console.error("Failed to invite team member", error);
    return NextResponse.json(
      { error: "Could not create invitation" },
      { status: 500 },
    );
  }
}
