import { NextResponse } from "next/server";
import { requireCustomersImportWriteAccess } from "@/lib/customers/import-customers.access";
import { listImportableCustomers } from "@/lib/customers/import-customers.queries";

type RouteContext = {
  params: Promise<{ restaurantId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { restaurantId } = await params;
  const access = await requireCustomersImportWriteAccess(restaurantId);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const data = await listImportableCustomers(access.userId, restaurantId);

  return NextResponse.json(data);
}
