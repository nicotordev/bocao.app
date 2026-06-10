import { NextResponse } from "next/server";
import {
  requireRestaurantCustomersAccess,
  requireRestaurantCustomersWriteAccess,
} from "@/lib/customers/api-auth";
import { deleteCustomers, getCustomerDetail } from "@/lib/customers/repository";
import { getLocale } from "next-intl/server";

type RouteContext = {
  params: Promise<{ restaurantId: string; customerId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { restaurantId, customerId } = await params;
  const access = await requireRestaurantCustomersAccess(restaurantId);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const locale = await getLocale();
  const restaurant =
    access.context.restaurants.find((entry) => entry.id === restaurantId) ??
    access.context.activeRestaurant;

  try {
    const customer = await getCustomerDetail(restaurantId, customerId, {
      currency: restaurant?.currency ?? "CLP",
      timezone: restaurant?.timezone ?? "America/Santiago",
      locale,
      neverLabel: locale === "es" ? "Sin visitas" : "No visits yet",
      notAvailableLabel:
        locale === "es" ? "Sin datos comparativos" : "No comparison data",
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error("Failed to fetch customer", error);
    return NextResponse.json(
      { error: "Could not fetch customer" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { restaurantId, customerId } = await params;
  const access = await requireRestaurantCustomersWriteAccess(restaurantId);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  try {
    const deletedCount = await deleteCustomers(restaurantId, [customerId]);

    if (deletedCount === 0) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ deletedCount });
  } catch (error) {
    console.error("Failed to delete customer", error);
    return NextResponse.json(
      { error: "Could not delete customer" },
      { status: 500 },
    );
  }
}
