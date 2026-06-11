import { NextResponse } from "next/server";
import { requireTeamAccess } from "@/lib/team/api-auth";
import { cancelTeamInvitation, TeamServiceError } from "@/lib/team/service";

type RouteContext = {
  params: Promise<{ invitationId: string }>;
};

export async function DELETE(_request: Request, { params }: RouteContext) {
  const access = await requireTeamAccess();

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const { invitationId } = await params;

  try {
    await cancelTeamInvitation(access.context, invitationId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof TeamServiceError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }

    console.error("Failed to cancel invitation", error);
    return NextResponse.json(
      { error: "Could not cancel invitation" },
      { status: 500 },
    );
  }
}
