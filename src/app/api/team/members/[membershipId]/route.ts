import { NextResponse } from "next/server";
import { requireTeamAccess } from "@/lib/team/api-auth";
import { updateMemberBodySchema } from "@/lib/team/schema";
import {
  removeTeamMember,
  TeamServiceError,
  updateTeamMember,
} from "@/lib/team/service";

type RouteContext = {
  params: Promise<{ membershipId: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const access = await requireTeamAccess();

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const { membershipId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateMemberBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  try {
    const result = await updateTeamMember(
      access.context,
      membershipId,
      parsed.data,
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof TeamServiceError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }

    console.error("Failed to update team member", error);
    return NextResponse.json(
      { error: "Could not update member" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const access = await requireTeamAccess();

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const { membershipId } = await params;

  try {
    await removeTeamMember(access.context, membershipId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof TeamServiceError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }

    console.error("Failed to remove team member", error);
    return NextResponse.json(
      { error: "Could not remove member" },
      { status: 500 },
    );
  }
}
