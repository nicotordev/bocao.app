"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import type { ImportableMenuCategory } from "@/lib/menu/import-products.types";
import { formatCurrency } from "@/lib/orders/currency";
import { cn } from "@/lib/utils";
import type { MenuPageLabels } from "./types";

type ImportProductsReuseTabProps = {
  labels: MenuPageLabels["importProducts"];
  availableLabel: string;
  unavailableLabel: string;
  currency: string;
  categories: ImportableMenuCategory[];
  selectedProductIds: Set<string>;
  onSelectedProductIdsChange: (next: Set<string>) => void;
};

function getCategoryCheckState(
  category: ImportableMenuCategory,
  selectedProductIds: Set<string>,
): boolean | "indeterminate" {
  const productIds = category.products.map((product) => product.id);
  const selectedCount = productIds.filter((id) =>
    selectedProductIds.has(id),
  ).length;

  if (selectedCount === 0) {
    return false;
  }

  if (selectedCount === productIds.length) {
    return true;
  }

  return "indeterminate";
}

export function ImportProductsReuseTab({
  labels,
  availableLabel,
  unavailableLabel,
  currency,
  categories,
  selectedProductIds,
  onSelectedProductIdsChange,
}: ImportProductsReuseTabProps) {
  const [search, setSearch] = useState("");
  const [organizationId, setOrganizationId] = useState("all");
  const [restaurantId, setRestaurantId] = useState("all");
  const [categoryId, setCategoryId] = useState("all");

  const organizations = useMemo(() => {
    const map = new Map<string, string>();

    for (const category of categories) {
      map.set(category.sourceOrganizationId, category.sourceOrganizationName);
    }

    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [categories]);

  const restaurants = useMemo(() => {
    const map = new Map<string, string>();

    for (const category of categories) {
      if (
        organizationId !== "all" &&
        category.sourceOrganizationId !== organizationId
      ) {
        continue;
      }

      map.set(category.sourceRestaurantId, category.sourceRestaurantName);
    }

    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [categories, organizationId]);

  const filterCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return categories.filter((category) => {
      if (
        organizationId !== "all" &&
        category.sourceOrganizationId !== organizationId
      ) {
        return false;
      }

      if (
        restaurantId !== "all" &&
        category.sourceRestaurantId !== restaurantId
      ) {
        return false;
      }

      if (categoryId !== "all" && category.id !== categoryId) {
        return false;
      }

      if (!query) {
        return true;
      }

      if (category.name.toLowerCase().includes(query)) {
        return true;
      }

      return category.products.some(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          (product.description?.toLowerCase().includes(query) ?? false),
      );
    });
  }, [categories, categoryId, organizationId, restaurantId, search]);

  const grouped = useMemo(() => {
    const groups = new Map<
      string,
      {
        organizationName: string;
        restaurants: Map<
          string,
          {
            restaurantName: string;
            categories: ImportableMenuCategory[];
          }
        >;
      }
    >();

    for (const category of filterCategories) {
      const orgGroup = groups.get(category.sourceOrganizationId) ?? {
        organizationName: category.sourceOrganizationName,
        restaurants: new Map(),
      };

      const restaurantGroup = orgGroup.restaurants.get(
        category.sourceRestaurantId,
      ) ?? {
        restaurantName: category.sourceRestaurantName,
        categories: [],
      };

      restaurantGroup.categories.push(category);
      orgGroup.restaurants.set(category.sourceRestaurantId, restaurantGroup);
      groups.set(category.sourceOrganizationId, orgGroup);
    }

    return groups;
  }, [filterCategories]);

  function toggleCategory(category: ImportableMenuCategory, checked: boolean) {
    const next = new Set(selectedProductIds);

    for (const product of category.products) {
      if (checked) {
        next.add(product.id);
      } else {
        next.delete(product.id);
      }
    }

    onSelectedProductIdsChange(next);
  }

  function toggleProduct(productId: string, checked: boolean) {
    const next = new Set(selectedProductIds);

    if (checked) {
      next.add(productId);
    } else {
      next.delete(productId);
    }

    onSelectedProductIdsChange(next);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <div className="shrink-0 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2 md:col-span-2 xl:col-span-1">
          <Label htmlFor="import-search">{labels.searchPlaceholder}</Label>
          <Input
            id="import-search"
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
              setCategoryId("all");
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
          <Select
            value={restaurantId}
            onValueChange={(value) => {
              setRestaurantId(value);
              setCategoryId("all");
            }}
          >
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

        <div className="space-y-2">
          <Label>{labels.category}</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{labels.allCategories}</SelectItem>
              {filterCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-3xl border border-border">
        <div className="space-y-6 p-4">
          {filterCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="font-medium">{labels.noReusableProductsFound}</p>
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
                  ([restId, restaurantGroup]) => (
                    <div key={restId} className="space-y-3">
                      <p className="text-sm font-medium">
                        {restaurantGroup.restaurantName}
                      </p>

                      {restaurantGroup.categories.map((category) => {
                        const checkState = getCategoryCheckState(
                          category,
                          selectedProductIds,
                        );

                        return (
                          <div
                            key={category.id}
                            className="rounded-3xl border border-border bg-card"
                          >
                            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                              <Checkbox
                                checked={checkState}
                                onCheckedChange={(checked) =>
                                  toggleCategory(category, checked === true)
                                }
                                aria-label={category.name}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium">{category.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {category.products.length}{" "}
                                  {labels.product.toLowerCase()}
                                  {category.products.length === 1 ? "" : "s"}
                                </p>
                              </div>
                            </div>

                            <div className="divide-y divide-border">
                              {category.products.map((product) => (
                                <label
                                  key={product.id}
                                  className={cn(
                                    "flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40",
                                    selectedProductIds.has(product.id) &&
                                      "bg-muted/30",
                                  )}
                                >
                                  <Checkbox
                                    checked={selectedProductIds.has(product.id)}
                                    onCheckedChange={(checked) =>
                                      toggleProduct(
                                        product.id,
                                        checked === true,
                                      )
                                    }
                                  />

                                  {product.imageUrl ? (
                                    <Image
                                      src={product.imageUrl}
                                      alt=""
                                      width={40}
                                      height={40}
                                      className="size-10 rounded-xl object-cover"
                                      unoptimized
                                    />
                                  ) : (
                                    <div className="size-10 rounded-xl bg-muted" />
                                  )}

                                  <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium">
                                      {product.name}
                                    </p>
                                    {product.description ? (
                                      <p className="truncate text-xs text-muted-foreground">
                                        {product.description}
                                      </p>
                                    ) : null}
                                  </div>

                                  <div className="flex shrink-0 flex-col items-end gap-1">
                                    <span className="text-sm font-medium">
                                      {formatCurrency(
                                        product.priceCents,
                                        currency,
                                      )}
                                    </span>
                                    <Badge
                                      variant={
                                        product.isAvailable
                                          ? "secondary"
                                          : "outline"
                                      }
                                    >
                                      {product.isAvailable
                                        ? availableLabel
                                        : unavailableLabel}
                                    </Badge>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ),
                )}
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
