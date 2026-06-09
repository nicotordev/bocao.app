import { NextResponse } from "next/server";
import { requireMenuImportWriteAccess } from "@/lib/menu/import-products.access";

type RouteContext = {
  params: Promise<{ restaurantId: string }>;
};

const TEMPLATE_CSV = `categoryName,productName,description,price,imageUrl,isAvailable
Starters,Garlic Bread,Toasted bread with garlic butter,4.50,,true
Main Courses,Grilled Salmon,Fresh salmon with seasonal vegetables,18.90,https://example.com/salmon.jpg,true
`;

export async function GET(_request: Request, { params }: RouteContext) {
  const { restaurantId } = await params;
  const access = await requireMenuImportWriteAccess(restaurantId);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  return new NextResponse(TEMPLATE_CSV, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="menu-import-template.csv"',
    },
  });
}
