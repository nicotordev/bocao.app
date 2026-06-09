import { NextResponse } from "next/server";
import { requireMenuImportWriteAccess } from "@/lib/menu/import-products.access";
import { listImportableMenuCategories } from "@/lib/menu/import-products.queries";

type RouteContext = {
  params: Promise<{ restaurantId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { restaurantId } = await params;
  const access = await requireMenuImportWriteAccess(restaurantId);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const data = await listImportableMenuCategories(access.userId, restaurantId);

  return NextResponse.json(data);
}
