"use client";

import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCustomerInitials } from "@/lib/customers/format";
import type { ImportableCustomer } from "@/lib/customers/import-customers.types";
import { cn } from "@/lib/utils";
import type { CustomersLabels } from "./types";

type ImportCustomersReuseTabProps = {
  labels: CustomersLabels["importCustomers"];
  customers: ImportableCustomer[];
  selectedCustomerIds: Set<string>;
  onSelectedCustomerIdsChange: (next: Set<string>) => void;
};

function getRestaurantCheckState(
  customerIds: string[],
  selectedCustomerIds: Set<string>,
): boolean | "indeterminate" {
  const selectedCount = customerIds.filter((id) =>
    selectedCustomerIds.has(id),
  ).length;

  if (selectedCount === 0) {
    return false;
  }

  if (selectedCount === customerIds.length) {
    return true;
  }

  return "indeterminate";
}

export function ImportCustomersReuseTab({
  labels,
  customers,
  selectedCustomerIds,
  onSelectedCustomerIdsChange,
}: ImportCustomersReuseTabProps) {
  const [search, setSearch] = useState("");
  const [organizationId, setOrganizationId] = useState("all");
  const [restaurantId, setRestaurantId] = useState("all");

  const organizations = useMemo(() => {
    const map = new Map<string, string>();

    for (const customer of customers) {
      map.set(customer.sourceOrganizationId, customer.sourceOrganizationName);
    }

    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [customers]);

  const restaurants = useMemo(() => {
    const map = new Map<string, string>();

    for (const customer of customers) {
      if (
        organizationId !== "all" &&
        customer.sourceOrganizationId !== organizationId
      ) {
        continue;
      }

      map.set(customer.sourceRestaurantId, customer.sourceRestaurantName);
    }

    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [customers, organizationId]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers.filter((customer) => {
      if (
        organizationId !== "all" &&
        customer.sourceOrganizationId !== organizationId
      ) {
        return false;
      }

      if (
        restaurantId !== "all" &&
        customer.sourceRestaurantId !== restaurantId
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        customer.name,
        customer.email ?? "",
        customer.phone ?? "",
        customer.documentId ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [customers, organizationId, restaurantId, search]);

  const grouped = useMemo(() => {
    const groups = new Map<
      string,
      {
        organizationName: string;
        restaurants: Map<
          string,
          {
            restaurantName: string;
            customers: ImportableCustomer[];
          }
        >;
      }
    >();

    for (const customer of filteredCustomers) {
      const orgGroup = groups.get(customer.sourceOrganizationId) ?? {
        organizationName: customer.sourceOrganizationName,
        restaurants: new Map(),
      };

      const restaurantGroup = orgGroup.restaurants.get(
        customer.sourceRestaurantId,
      ) ?? {
        restaurantName: customer.sourceRestaurantName,
        customers: [],
      };

      restaurantGroup.customers.push(customer);
      orgGroup.restaurants.set(customer.sourceRestaurantId, restaurantGroup);
      groups.set(customer.sourceOrganizationId, orgGroup);
    }

    return groups;
  }, [filteredCustomers]);

  function toggleRestaurant(customerIds: string[], checked: boolean) {
    const next = new Set(selectedCustomerIds);

    for (const customerId of customerIds) {
      if (checked) {
        next.add(customerId);
      } else {
        next.delete(customerId);
      }
    }

    onSelectedCustomerIdsChange(next);
  }

  function toggleCustomer(customerId: string, checked: boolean) {
    const next = new Set(selectedCustomerIds);

    if (checked) {
      next.add(customerId);
    } else {
      next.delete(customerId);
    }

    onSelectedCustomerIdsChange(next);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <div className="grid shrink-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-2 md:col-span-2 xl:col-span-1">
          <Label htmlFor="import-customers-search">
            {labels.searchPlaceholder}
          </Label>
          <Input
            id="import-customers-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={labels.searchPlaceholder}
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label>{labels.organization}</Label>
          <Select
            value={organizationId}
            onValueChange={(value) => {
              setOrganizationId(value);
              setRestaurantId("all");
            }}
          >
            <SelectTrigger className="rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{labels.allOrganizations}</SelectItem>
              {organizations.map((organization) => (
                <SelectItem key={organization.id} value={organization.id}>
                  {organization.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{labels.restaurant}</Label>
          <Select value={restaurantId} onValueChange={setRestaurantId}>
            <SelectTrigger className="rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{labels.allRestaurants}</SelectItem>
              {restaurants.map((restaurant) => (
                <SelectItem key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-3xl border border-border">
        <div className="space-y-6 p-4">
          {filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="font-medium">{labels.noReusableCustomersFound}</p>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {labels.empty}
              </p>
            </div>
          ) : (
            Array.from(grouped.entries()).map(([orgId, orgGroup]) => (
              <section key={orgId} className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {orgGroup.organizationName}
                </h3>

                {Array.from(orgGroup.restaurants.entries()).map(
                  ([restId, restaurantGroup]) => {
                    const restaurantCustomerIds = restaurantGroup.customers.map(
                      (customer) => customer.id,
                    );
                    const checkState = getRestaurantCheckState(
                      restaurantCustomerIds,
                      selectedCustomerIds,
                    );

                    return (
                      <div
                        key={restId}
                        className="rounded-3xl border border-border bg-card"
                      >
                        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                          <Checkbox
                            checked={checkState}
                            onCheckedChange={(checked) =>
                              toggleRestaurant(
                                restaurantCustomerIds,
                                checked === true,
                              )
                            }
                            aria-label={restaurantGroup.restaurantName}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">
                              {restaurantGroup.restaurantName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {restaurantGroup.customers.length}{" "}
                              {labels.customer.toLowerCase()}
                              {restaurantGroup.customers.length === 1 ? "" : "s"}
                            </p>
                          </div>
                        </div>

                        <div className="divide-y divide-border">
                          {restaurantGroup.customers.map((customer) => (
                            <label
                              key={customer.id}
                              className={cn(
                                "flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40",
                                selectedCustomerIds.has(customer.id) &&
                                  "bg-muted/30",
                              )}
                            >
                              <Checkbox
                                checked={selectedCustomerIds.has(customer.id)}
                                onCheckedChange={(checked) =>
                                  toggleCustomer(customer.id, checked === true)
                                }
                              />

                              <Avatar size="sm">
                                {customer.avatar ? (
                                  <AvatarImage
                                    src={customer.avatar}
                                    alt={customer.name}
                                  />
                                ) : null}
                                <AvatarFallback>
                                  {getCustomerInitials(customer.name)}
                                </AvatarFallback>
                              </Avatar>

                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">
                                  {customer.name}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {[customer.email, customer.phone]
                                    .filter(Boolean)
                                    .join(" · ") || "—"}
                                </p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  },
                )}
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
