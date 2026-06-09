import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";
import { ReservationsPageClient } from "@/components/dashboard/reservations/reservations-page-client";
import { listCustomers } from "@/lib/customers/repository";
import { getDashboardContext } from "@/lib/dashboard/context";
import { getQueryClient } from "@/lib/query/get-query-client";
import { reservationsListQueryOptions } from "@/lib/query/reservations/reservations.queries";

export default async function ReservationsPage() {
  const t = await getTranslations("dashboard.reservations");
  const context = await getDashboardContext();
  const restaurantId = context?.activeRestaurant?.id ?? "";
  const queryClient = getQueryClient();
  const customers = restaurantId ? await listCustomers(restaurantId) : [];

  if (restaurantId) {
    await queryClient.prefetchQuery(reservationsListQueryOptions(restaurantId));
  }

  const labels = {
    header: {
      title: t("header.title"),
      subtitle: t("header.subtitle"),
    },
    actions: {
      newReservation: t("actions.newReservation"),
      refresh: t("actions.refresh"),
      edit: t("actions.edit"),
      delete: t("actions.delete"),
      confirm: t("actions.confirm"),
      seat: t("actions.seat"),
      complete: t("actions.complete"),
      cancel: t("actions.cancel"),
      clearFilters: t("actions.clearFilters"),
      addCustomer: t("actions.addCustomer"),
      removeCustomer: t("actions.removeCustomer"),
      menu: t("actions.menu"),
      noShow: t("actions.noShow"),
    },
    filters: {
      search: t("filters.search"),
      searchPlaceholder: t("filters.searchPlaceholder"),
      status: t("filters.status"),
      date: t("filters.date"),
      all: t("filters.all"),
      noActive: t("filters.noActive"),
    },
    statuses: {
      all: t("statuses.all"),
      PENDING: t("statuses.PENDING"),
      CONFIRMED: t("statuses.CONFIRMED"),
      SEATED: t("statuses.SEATED"),
      COMPLETED: t("statuses.COMPLETED"),
      CANCELLED: t("statuses.CANCELLED"),
      NO_SHOW: t("statuses.NO_SHOW"),
    },
    kpis: {
      total: t("kpis.total"),
      confirmed: t("kpis.confirmed"),
      pending: t("kpis.pending"),
      guests: t("kpis.guests"),
    },
    form: {
      guestCount: t("form.guestCount"),
      scheduledAt: t("form.scheduledAt"),
      status: t("form.status"),
      notes: t("form.notes"),
      submitCreate: t("form.submitCreate"),
      submitEdit: t("form.submitEdit"),
      successCreate: t("form.successCreate"),
      successCreateMultiple: t.raw("form.successCreateMultiple"),
      successUpdate: t("form.successUpdate"),
      successDelete: t("form.successDelete"),
      errorUpdateStatus: t("form.errorUpdateStatus"),
      errorDelete: t("form.errorDelete"),
      errorUpdate: t("form.errorUpdate"),
      errorCreate: t("form.errorCreate"),
      confirmDelete: t("form.confirmDelete"),
      createDescription: t("form.createDescription"),
      editDescription: t("form.editDescription"),
      cancel: t("form.cancel"),
      saving: t("form.saving"),
      save: t("form.save"),
      create: t("form.create"),
      customer: {
        title: t("form.customer.title"),
        description: t("form.customer.description"),
        name: t("form.customer.name"),
        namePlaceholder: t("form.customer.namePlaceholder"),
        phone: t("form.customer.phone"),
        phonePlaceholder: t("form.customer.phonePlaceholder"),
        email: t("form.customer.email"),
        emailPlaceholder: t("form.customer.emailPlaceholder"),
        documentId: t("form.customer.documentId"),
        documentIdPlaceholder: t("form.customer.documentIdPlaceholder"),
        address: t("form.customer.address"),
        addressPlaceholder: t("form.customer.addressPlaceholder"),
        notes: t("form.customer.notes"),
        notesPlaceholder: t("form.customer.notesPlaceholder"),
        searchPlaceholder: t("form.customer.searchPlaceholder"),
        noResults: t("form.customer.noResults"),
        selectedHint: t("form.customer.selectedHint"),
        emptySelection: t("form.customer.emptySelection"),
        picker: {
          title: t("form.customer.picker.title"),
          description: t("form.customer.picker.description"),
          addCustomer: t("form.customer.picker.addCustomer"),
          addSuccess: t("form.customer.picker.addSuccess"),
        },
      },
    },
    validation: {
      customers: t("validation.customers"),
      draftCustomerName: t("validation.draftCustomerName"),
    },
    empty: {
      title: t("empty.title"),
      description: t("empty.description"),
      cta: t("empty.cta"),
    },
  };

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ReservationsPageClient
        labels={labels}
        restaurantId={restaurantId}
        customers={customers}
      />
    </HydrationBoundary>
  );
}
