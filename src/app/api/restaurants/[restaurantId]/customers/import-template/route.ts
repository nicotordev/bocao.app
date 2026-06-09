import { NextResponse } from "next/server";
import { requireCustomersImportWriteAccess } from "@/lib/customers/import-customers.access";

type RouteContext = {
  params: Promise<{ restaurantId: string }>;
};

const TEMPLATE_CSV = `name,email,phone,documentId,address,notes,avatar
María González,maria@example.com,+56912345678,12.345.678-9,Av. Providencia 123,Prefiere mesa junto a ventana,https://example.com/avatar.jpg
Juan Pérez,juan@example.com,+56987654321,98.765.432-1,Los Leones 456,Sin gluten,
`;

export async function GET(_request: Request, { params }: RouteContext) {
  const { restaurantId } = await params;
  const access = await requireCustomersImportWriteAccess(restaurantId);

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
      "Content-Disposition": 'attachment; filename="customers-import-template.csv"',
    },
  });
}
