import { getTranslations } from "next-intl/server";
import { NewOrderPageClient } from "@/components/dashboard/orders/new/new-order-page-client";
import type { NewOrderLabels } from "@/components/dashboard/orders/new/types";
import { listCustomers } from "@/lib/customers/repository";
import { getDashboardContext } from "@/lib/dashboard/context";
import { listMenuItems } from "@/lib/menu/repository";
import { PERMISSIONS } from "@/lib/rbac/permissions";

export default async function NewOrderPage() {
  const t = await getTranslations("dashboard.orders.new");
  const tChannels = await getTranslations("dashboard.orders.channels");
  const context = await getDashboardContext();
  const restaurantId = context?.activeRestaurant?.id ?? "";
  const currency = context?.activeRestaurant?.currency ?? "CLP";
  const canCreate =
    context?.membership.permissions.includes(PERMISSIONS.ORDERS_WRITE) ?? false;

  const menuItems = restaurantId ? await listMenuItems(restaurantId) : [];
  const customers = restaurantId ? await listCustomers(restaurantId) : [];

  const labels: NewOrderLabels = {
    header: {
      title: t("header.title"),
      subtitle: t("header.subtitle"),
    },
    breadcrumb: {
      orders: t("breadcrumb.orders"),
      new: t("breadcrumb.new"),
    },
    actions: {
      back: t("actions.back"),
      submit: t("actions.submit"),
      submitting: t("actions.submitting"),
      addItem: t("actions.addItem"),
      removeItem: t("actions.removeItem"),
      addCustomer: t("actions.addCustomer"),
      removeCustomer: t("actions.removeCustomer"),
    },
    customer: {
      title: t("customer.title"),
      description: t("customer.description"),
      name: t("customer.name"),
      namePlaceholder: t("customer.namePlaceholder"),
      phone: t("customer.phone"),
      phonePlaceholder: t("customer.phonePlaceholder"),
      searchPlaceholder: t("customer.searchPlaceholder"),
      noResults: t("customer.noResults"),
      selectedHint: t("customer.selectedHint"),
      newHint: t("customer.newHint"),
      tableNumber: t("customer.tableNumber"),
      tableNumberPlaceholder: t("customer.tableNumberPlaceholder"),
      emptySelection: t("customer.emptySelection"),
    },
    channel: {
      title: t("channel.title"),
      description: t("channel.description"),
      label: t("channel.label"),
    },
    items: {
      title: t("items.title"),
      description: t("items.description"),
      menuLabel: t("items.menuLabel"),
      menuPlaceholder: t("items.menuPlaceholder"),
      quantity: t("items.quantity"),
      price: t("items.price"),
      lineTotal: t("items.lineTotal"),
      empty: t("items.empty"),
      emptyDescription: t("items.emptyDescription"),
      photos: t("items.photos"),
      picker: {
        title: t("items.picker.title"),
        description: t("items.picker.description"),
        addProduct: t("items.picker.addProduct"),
        customProduct: t("items.picker.customProduct"),
        emptyMenuTitle: t("items.picker.emptyMenuTitle"),
        emptyMenuDescription: t("items.picker.emptyMenuDescription"),
        footerHint: t("items.picker.footerHint"),
        customProductTitle: t("items.picker.customProductTitle"),
        customProductDescription: t("items.picker.customProductDescription"),
        customNameLabel: t("items.picker.customNameLabel"),
        customNamePlaceholder: t("items.picker.customNamePlaceholder"),
        customPriceLabel: t("items.picker.customPriceLabel"),
        customQuantityLabel: t("items.picker.customQuantityLabel"),
        addCustomSuccess: t("items.picker.addCustomSuccess"),
      },
    },
    photos: {
      addPhoto: t("photos.addPhoto"),
      removePhoto: t("photos.removePhoto"),
      uploading: t("photos.uploading"),
      uploadError: t("photos.uploadError"),
      invalidImageType: t("photos.invalidImageType"),
      imageTooLarge: t("photos.imageTooLarge"),
      storageNotConfigured: t("photos.storageNotConfigured"),
      moveEarlier: t("photos.moveEarlier"),
      moveLater: t("photos.moveLater"),
      photoSortOrder: t("photos.photoSortOrder"),
    },
    notes: {
      title: t("notes.title"),
      description: t("notes.description"),
      placeholder: t("notes.placeholder"),
    },
    summary: {
      title: t("summary.title"),
      subtotal: t("summary.subtotal"),
      taxes: t("summary.taxes"),
      total: t("summary.total"),
      taxNote: t("summary.taxNote"),
    },
    channels: {
      whatsapp: tChannels("whatsapp"),
      web: tChannels("web"),
      dineIn: tChannels("dineIn"),
      uberEats: tChannels("uberEats"),
      rappi: tChannels("rappi"),
    },
    validation: {
      customers: t("validation.customers"),
      tableNumber: t("validation.tableNumber"),
      draftCustomerName: t("validation.draftCustomerName"),
      items: t("validation.items"),
      itemName: t("validation.itemName"),
      itemPrice: t("validation.itemPrice"),
      itemQuantity: t("validation.itemQuantity"),
    },
    feedback: {
      success: t("feedback.success"),
      error: t("feedback.error"),
    },
    permissions: {
      deniedTitle: t("permissions.deniedTitle"),
      deniedDescription: t("permissions.deniedDescription"),
    },
  };

  return (
    <NewOrderPageClient
      labels={labels}
      restaurantId={restaurantId}
      currency={currency}
      canCreate={canCreate}
      menuItems={menuItems}
      customers={customers}
    />
  );
}
