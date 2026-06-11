import { NextResponse } from "next/server";
import { requireTeamAccess } from "@/lib/team/api-auth";
import { resendTeamInvitation, TeamServiceError } from "@/lib/team/service";

type RouteContext = {
  params: Promise<{ invitationId: string }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  const access = await requireTeamAccess();

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const { invitationId } = await params;

  try {
    const result = await resendTeamInvitation(access.context, invitationId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof TeamServiceError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }

    console.error("Failed to resend invitation", error);
    return NextResponse.json(
      { error: "Could not resend invitation" },
      { status: 500 },
    );
  }
}
