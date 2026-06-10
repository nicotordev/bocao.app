import { NextResponse } from "next/server";
import {
  requireRestaurantCustomersAccess,
  requireRestaurantCustomersWriteAccess,
} from "@/lib/customers/api-auth";
import {
  customersListQuerySchema,
  parseCustomersListSearchParams,
} from "@/lib/customers/filters";
import { createCustomer } from "@/lib/customers/repository";
import { createCustomerBodySchema } from "@/lib/customers/schemas";
import { loadCustomersPageData } from "@/lib/customers/server";

type RouteContext = {
  params: Promise<{ restaurantId: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  const { restaurantId } = await params;
  const access = await requireRestaurantCustomersAccess(restaurantId);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = customersListQuerySchema.safeParse({
    search: searchParams.get("search") ?? undefined,
    segment: searchParams.get("segment") ?? undefined,
    channel: searchParams.get("channel") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
    tab: searchParams.get("tab") ?? undefined,
    customerId: searchParams.get("customerId") ?? undefined,
    savedSegmentId: searchParams.get("savedSegmentId") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters" },
      { status: 400 },
    );
  }

  try {
    const filters = parseCustomersListSearchParams(
      Object.fromEntries(searchParams.entries()),
    );
    const data = await loadCustomersPageData(
      restaurantId,
      filters,
      access.context,
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to list customers", error);
    return NextResponse.json(
      { error: "Could not fetch customers" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const { restaurantId } = await params;
  const access = await requireRestaurantCustomersWriteAccess(restaurantId);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createCustomerBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  try {
    const customer = await createCustomer(restaurantId, parsed.data);

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error("Failed to create customer", error);
    return NextResponse.json(
      { error: "Could not create customer" },
      { status: 500 },
    );
  }
}
