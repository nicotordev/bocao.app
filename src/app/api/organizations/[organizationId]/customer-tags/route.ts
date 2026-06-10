import { NextResponse } from "next/server";
import { createCustomerTagBodySchema } from "@/lib/customers/tags.schemas";
import {
  requireOrganizationCustomerTagsAccess,
  requireOrganizationCustomerTagsWriteAccess,
} from "@/lib/customers/tags.api-auth";
import {
  createCustomerTag,
  listCustomerTags,
} from "@/lib/customers/tags.repository";

type RouteContext = {
  params: Promise<{ organizationId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { organizationId } = await params;
  const access = await requireOrganizationCustomerTagsAccess(organizationId);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  try {
    const tags = await listCustomerTags(organizationId);
    return NextResponse.json({ tags });
  } catch (error) {
    console.error("Failed to list customer tags", error);
    return NextResponse.json(
      { error: "Could not fetch customer tags" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const { organizationId } = await params;
  const access =
    await requireOrganizationCustomerTagsWriteAccess(organizationId);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createCustomerTagBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  try {
    const tag = await createCustomerTag(organizationId, parsed.data);
    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    console.error("Failed to create customer tag", error);

    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return NextResponse.json(
        { error: "A tag with this name already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Could not create customer tag" },
      { status: 500 },
    );
  }
}
