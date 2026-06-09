import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";
import { KitchenStationsPageClient } from "@/components/dashboard/kitchen/stations/kitchen-stations-page-client";
import type { KitchenStationsLabels } from "@/components/dashboard/kitchen/stations/types";
import { getDashboardContext } from "@/lib/dashboard/context";
import { getQueryClient } from "@/lib/query/get-query-client";
import { kitchenStationsQueryOptions } from "@/lib/query/kitchen/stations.queries";
import { PERMISSIONS } from "@/lib/rbac/permissions";

export default async function KitchenStationsPage() {
  const t = await getTranslations("dashboard.kitchen.stations");
  const context = await getDashboardContext();
  const restaurantId = context?.activeRestaurant?.id ?? "";
  const canEdit =
    context?.membership.permissions.includes(PERMISSIONS.RESTAURANT_WRITE) ??
    false;
  const canView =
    context?.membership.permissions.includes(PERMISSIONS.ORDERS_READ) ?? false;
  const queryClient = getQueryClient();

  if (restaurantId) {
    await queryClient.prefetchQuery(kitchenStationsQueryOptions(restaurantId));
  }

  const labels: KitchenStationsLabels = {
    header: {
      title: t("header.title"),
      subtitle: t("header.subtitle"),
      backToKitchen: t("header.backToKitchen"),
      createStation: t("header.createStation"),
    },
    card: {
      description: t("card.description"),
      noDescription: t("card.noDescription"),
      category: t("card.category"),
      activeOrders: t("card.activeOrders"),
      activeOrdersCount: t.raw("card.activeOrdersCount"),
      sortOrder: t("card.sortOrder"),
      edit: t("card.edit"),
      activate: t("card.activate"),
      deactivate: t("card.deactivate"),
      delete: t("card.delete"),
      moveUp: t("card.moveUp"),
      moveDown: t("card.moveDown"),
      deleteBlocked: t("card.deleteBlocked"),
    },
    status: {
      active: t("status.active"),
      inactive: t("status.inactive"),
    },
    categories: {
      grill: t("categories.grill"),
      fryer: t("categories.fryer"),
      sushi: t("categories.sushi"),
      bar: t("categories.bar"),
      desserts: t("categories.desserts"),
      delivery: t("categories.delivery"),
      prep: t("categories.prep"),
      other: t("categories.other"),
    },
    form: {
      createTitle: t("form.createTitle"),
      createDescription: t("form.createDescription"),
      editTitle: t("form.editTitle"),
      editDescription: t("form.editDescription"),
      name: t("form.name"),
      namePlaceholder: t("form.namePlaceholder"),
      description: t("form.description"),
      descriptionPlaceholder: t("form.descriptionPlaceholder"),
      category: t("form.category"),
      categoryPlaceholder: t("form.categoryPlaceholder"),
      sortOrder: t("form.sortOrder"),
      sortOrderHint: t("form.sortOrderHint"),
      isActive: t("form.isActive"),
      isActiveHint: t("form.isActiveHint"),
      save: t("form.save"),
      saving: t("form.saving"),
      cancel: t("form.cancel"),
      delete: t("form.delete"),
      confirmDelete: t("form.confirmDelete"),
    },
    empty: {
      title: t("empty.title"),
      description: t("empty.description"),
      cta: t("empty.cta"),
    },
    loading: t("loading"),
    feedback: {
      createSuccess: t("feedback.createSuccess"),
      updateSuccess: t("feedback.updateSuccess"),
      deleteSuccess: t("feedback.deleteSuccess"),
      toggleSuccess: t("feedback.toggleSuccess"),
      error: t("feedback.error"),
      deleteBlocked: t("feedback.deleteBlocked"),
    },
    validation: {
      name: t("validation.name"),
    },
    permissions: {
      deniedDescription: t("permissions.deniedDescription"),
    },
  };

  if (!canView) {
    return (
      <main className="flex flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {labels.header.title}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {labels.permissions.deniedDescription}
        </p>
      </main>
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <KitchenStationsPageClient
        labels={labels}
        restaurantId={restaurantId}
        canEdit={canEdit}
      />
    </HydrationBoundary>
  );
}
