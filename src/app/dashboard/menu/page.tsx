import { getTranslations } from "next-intl/server";
import { MenuPageClient } from "@/components/dashboard/menu/menu-page-client";
import type { MenuPageLabels } from "@/components/dashboard/menu/types";
import { getDashboardContext } from "@/lib/dashboard/context";
import { listMenuItemRecords } from "@/lib/menu/repository";
import { PERMISSIONS } from "@/lib/rbac/permissions";

export default async function MenuPage() {
  const t = await getTranslations("dashboard.menu");
  const context = await getDashboardContext();
  const restaurantId = context?.activeRestaurant?.id ?? "";
  const currency = context?.activeRestaurant?.currency ?? "CLP";
  const canEdit =
    context?.membership.permissions.includes(PERMISSIONS.MENU_WRITE) ?? false;

  const items = restaurantId
    ? await listMenuItemRecords(restaurantId, { availableOnly: false })
    : [];

  const labels: MenuPageLabels = {
    header: {
      title: t("header.title"),
      subtitle: t("header.subtitle"),
    },
    empty: {
      title: t("empty.title"),
      description: t("empty.description"),
    },
    item: {
      photos: t("item.photos"),
      unavailable: t("item.unavailable"),
    },
    photos: {
      addPhoto: t("photos.addPhoto"),
      removePhoto: t("photos.removePhoto"),
      uploading: t("photos.uploading"),
      uploadError: t("photos.uploadError"),
      invalidImageType: t("photos.invalidImageType"),
      imageTooLarge: t("photos.imageTooLarge"),
      storageNotConfigured: t("photos.storageNotConfigured"),
      saveError: t("photos.saveError"),
      saveSuccess: t("photos.saveSuccess"),
    },
    permissions: {
      deniedTitle: t("permissions.deniedTitle"),
      deniedDescription: t("permissions.deniedDescription"),
    },
  };

  if (!canEdit && items.length === 0) {
    return (
      <main className="flex flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {labels.header.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {labels.header.subtitle}
          </p>
        </div>
      </main>
    );
  }

  return (
    <MenuPageClient
      labels={labels}
      restaurantId={restaurantId}
      currency={currency}
      canEdit={canEdit}
      items={items}
    />
  );
}
