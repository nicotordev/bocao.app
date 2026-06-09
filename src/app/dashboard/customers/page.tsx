import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";
import { CustomersPageClient } from "@/components/dashboard/customers/customers-page-client";
import type {
  CustomerSegmentLabelMap,
  CustomersLabels,
} from "@/components/dashboard/customers/types";
import { getDashboardContext } from "@/lib/dashboard/context";
import { parseCustomersListSearchParams } from "@/lib/customers/filters";
import { loadCustomersPageData } from "@/lib/customers/server";
import { getQueryClient } from "@/lib/query/get-query-client";
import { customersPageQueryOptions } from "@/lib/query/customers/customers.queries";
import { searchParamsToRecord } from "@/lib/list-url";

type CustomersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CustomersPage({
  searchParams,
}: CustomersPageProps) {
  const t = await getTranslations("dashboard.customers");
  const tCommon = await getTranslations("common");
  const context = await getDashboardContext();
  const restaurantId = context?.activeRestaurant?.id ?? "";
  const queryClient = getQueryClient();
  const resolvedSearchParams = searchParamsToRecord(await searchParams);
  const filters = parseCustomersListSearchParams(resolvedSearchParams);

  if (restaurantId && context) {
    await queryClient.prefetchQuery({
      ...customersPageQueryOptions(restaurantId, filters),
      queryFn: () => loadCustomersPageData(restaurantId, filters, context),
    });
  }

  const segmentLabels: CustomerSegmentLabelMap = {
    vip: t("segments.vip"),
    frequent: t("segments.frequent"),
    new: t("segments.new"),
    inactive: t("segments.inactive"),
    at_risk: t("segments.atRisk"),
    whatsapp: t("segments.whatsapp"),
    high_value: t("segments.highValue"),
  };

  const labels: CustomersLabels = {
    header: {
      title: t("header.title"),
      subtitle: t("header.subtitle"),
    },
    actions: {
      newCustomer: t("actions.newCustomer"),
      importCsv: t("actions.importCsv"),
      export: t("actions.export"),
      createCampaign: t("actions.createCampaign"),
      viewProfile: t("actions.viewProfile"),
      edit: t("actions.edit"),
      addTag: t("actions.addTag"),
      archive: t("actions.archive"),
      editProfile: t("actions.editProfile"),
      sendWhatsapp: t("actions.sendWhatsapp"),
      addNote: t("actions.addNote"),
      viewCustomers: t("actions.viewCustomers"),
      suggestedCampaign: t("actions.suggestedCampaign"),
      clearFilters: t("actions.clearFilters"),
      exportSuccess: t("actions.exportSuccess"),
      exportEmpty: t("actions.exportEmpty"),
      comingSoon: t("actions.comingSoon"),
    },
    kpis: {
      total: t("kpis.total"),
      frequent: t("kpis.frequent"),
      averageTicket: t("kpis.averageTicket"),
      inactive: t("kpis.inactive"),
      notAvailable: t("kpis.notAvailable"),
    },
    toolbar: {
      search: t("toolbar.search"),
      searchPlaceholder: t("toolbar.searchPlaceholder"),
      segment: t("toolbar.segment"),
      channel: t("toolbar.channel"),
      sort: t("toolbar.sort"),
      filters: t("toolbar.filters"),
    },
    segments: {
      all: t("segments.all"),
      vip: t("segments.vip"),
      frequent: t("segments.frequent"),
      new: t("segments.new"),
      inactive: t("segments.inactive"),
      atRisk: t("segments.atRisk"),
      whatsapp: t("segments.whatsapp"),
      highValue: t("segments.highValue"),
      cards: {
        vip: {
          name: t("segments.cards.vip.name"),
          description: t("segments.cards.vip.description"),
        },
        frequent: {
          name: t("segments.cards.frequent.name"),
          description: t("segments.cards.frequent.description"),
        },
        new: {
          name: t("segments.cards.new.name"),
          description: t("segments.cards.new.description"),
        },
        inactive: {
          name: t("segments.cards.inactive.name"),
          description: t("segments.cards.inactive.description"),
        },
        atRisk: {
          name: t("segments.cards.atRisk.name"),
          description: t("segments.cards.atRisk.description"),
        },
        whatsapp: {
          name: t("segments.cards.whatsapp.name"),
          description: t("segments.cards.whatsapp.description"),
        },
        highValue: {
          name: t("segments.cards.highValue.name"),
          description: t("segments.cards.highValue.description"),
        },
        reservationFrequent: {
          name: t("segments.cards.reservationFrequent.name"),
          description: t("segments.cards.reservationFrequent.description"),
        },
      },
    },
    channels: {
      all: t("channels.all"),
      whatsapp: t("channels.whatsapp"),
      web: t("channels.web"),
      in_person: t("channels.inPerson"),
      delivery: t("channels.delivery"),
      reservation: t("channels.reservation"),
    },
    sort: {
      last_visit: t("sort.lastVisit"),
      total_spend: t("sort.totalSpend"),
      order_count: t("sort.orderCount"),
      name: t("sort.name"),
      created_at: t("sort.createdAt"),
    },
    tabs: {
      customers: t("tabs.customers"),
      segments: t("tabs.segments"),
      activity: t("tabs.activity"),
    },
    table: {
      customer: t("table.customer"),
      contact: t("table.contact"),
      segment: t("table.segment"),
      orders: t("table.orders"),
      totalSpend: t("table.totalSpend"),
      averageTicket: t("table.averageTicket"),
      lastVisit: t("table.lastVisit"),
      channel: t("table.channel"),
      actions: t("table.actions"),
    },
    drawer: {
      title: t("drawer.title"),
      description: t("drawer.description"),
      profile: t("drawer.profile"),
      metrics: t("drawer.metrics"),
      preferences: t("drawer.preferences"),
      history: t("drawer.history"),
      name: t("drawer.name"),
      phone: t("drawer.phone"),
      email: t("drawer.email"),
      channel: t("drawer.channel"),
      createdAt: t("drawer.createdAt"),
      lastVisit: t("drawer.lastVisit"),
      orders: t("drawer.orders"),
      reservations: t("drawer.reservations"),
      totalSpend: t("drawer.totalSpend"),
      averageTicket: t("drawer.averageTicket"),
      frequency: t("drawer.frequency"),
      favoriteDishes: t("drawer.favoriteDishes"),
      notes: t("drawer.notes"),
      allergies: t("drawer.allergies"),
      tags: t("drawer.tags"),
      noNotes: t("drawer.noNotes"),
      noAllergies: t("drawer.noAllergies"),
      noTags: t("drawer.noTags"),
      noFavoriteDishes: t("drawer.noFavoriteDishes"),
      frequencyLevels: {
        high: t("drawer.frequencyLevels.high"),
        medium: t("drawer.frequencyLevels.medium"),
        low: t("drawer.frequencyLevels.low"),
        none: t("drawer.frequencyLevels.none"),
      },
      tabs: {
        orders: t("drawer.tabs.orders"),
        reservations: t("drawer.tabs.reservations"),
        activity: t("drawer.tabs.activity"),
        notes: t("drawer.tabs.notes"),
      },
    },
    insights: {
      title: t("insights.title"),
      subtitle: t("insights.subtitle"),
    },
    activity: {
      title: t("activity.title"),
      subtitle: t("activity.subtitle"),
    },
    empty: {
      title: t("empty.title"),
      description: t("empty.description"),
      cta: t("empty.cta"),
    },
    accessibility: {
      openActions: t("accessibility.openActions"),
      openDetails: t("accessibility.openDetails"),
      openFilters: t("accessibility.openFilters"),
    },
    pagination: {
      previous: tCommon("pagination.previous"),
      next: tCommon("pagination.next"),
      page: tCommon("pagination.page"),
      of: tCommon("pagination.of"),
    },
    formDialog: {
      customer: {
        name: t("form.name"),
        namePlaceholder: t("form.namePlaceholder"),
        phone: t("form.phone"),
        phonePlaceholder: t("form.phonePlaceholder"),
        email: t("form.email"),
        emailPlaceholder: t("form.emailPlaceholder"),
        documentId: t("form.documentId"),
        documentIdPlaceholder: t("form.documentIdPlaceholder"),
        address: t("form.address"),
        addressPlaceholder: t("form.addressPlaceholder"),
        notes: t("form.notes"),
        notesPlaceholder: t("form.notesPlaceholder"),
        searchPlaceholder: t("form.searchPlaceholder"),
        noResults: t("form.noResults"),
        selectedHint: t("form.selectedHint"),
        emptySelection: t("form.emptySelection"),
        picker: {
          title: t("form.picker.title"),
          description: t("form.picker.description"),
          addCustomer: t("form.picker.addCustomer"),
          addSuccess: t("form.picker.addSuccess"),
        },
      },
      validation: {
        draftCustomerName: t("validation.draftCustomerName"),
        customers: t("validation.draftCustomerName"),
      },
      actions: {
        addCustomer: t("form.picker.addCustomer"),
        removeCustomer: t("actions.archive"),
      },
      avatar: {
        changePhoto: t("avatar.changePhoto"),
        photoHint: t("avatar.photoHint"),
        photoUrl: t("avatar.photoUrl"),
        photoUrlPlaceholder: t("avatar.photoUrlPlaceholder"),
        invalidImageType: t("avatar.invalidImageType"),
        imageTooLarge: t("avatar.imageTooLarge"),
        uploadError: t("avatar.uploadError"),
      },
    },
    feedback: {
      createError: t("feedback.createError"),
    },
    importCustomers: {
      button: t("importCustomers.button"),
      title: t("importCustomers.title"),
      description: t("importCustomers.description"),
      importMode: t("importCustomers.importMode"),
      reuseFromRestaurants: t("importCustomers.reuseFromRestaurants"),
      importFromFile: t("importCustomers.importFromFile"),
      searchPlaceholder: t("importCustomers.searchPlaceholder"),
      empty: t("importCustomers.empty"),
      error: t("importCustomers.error"),
      loading: t("importCustomers.loading"),
      selectedCount: t.raw("importCustomers.selectedCount"),
      importSelected: t("importCustomers.importSelected"),
      cancel: t("importCustomers.cancel"),
      importedSuccessfully: t("importCustomers.importedSuccessfully"),
      importFailed: t("importCustomers.importFailed"),
      organization: t("importCustomers.organization"),
      restaurant: t("importCustomers.restaurant"),
      customer: t("importCustomers.customer"),
      noCustomersSelected: t("importCustomers.noCustomersSelected"),
      noReusableCustomersFound: t("importCustomers.noReusableCustomersFound"),
      allOrganizations: t("importCustomers.allOrganizations"),
      allRestaurants: t("importCustomers.allRestaurants"),
      uploadFile: t("importCustomers.uploadFile"),
      downloadTemplate: t("importCustomers.downloadTemplate"),
      previewImport: t("importCustomers.previewImport"),
      mapColumns: t("importCustomers.mapColumns"),
      invalidFileFormat: t("importCustomers.invalidFileFormat"),
      invalidRows: t("importCustomers.invalidRows"),
      importConfirmed: t("importCustomers.importConfirmed"),
      importCompleted: t("importCustomers.importCompleted"),
      fileTooLarge: t("importCustomers.fileTooLarge"),
      emptyFile: t("importCustomers.emptyFile"),
      noValidRows: t("importCustomers.noValidRows"),
      dropFileHint: t("importCustomers.dropFileHint"),
      row: t("importCustomers.row"),
      errors: t("importCustomers.errors"),
      validRows: t.raw("importCustomers.validRows"),
      invalidRowsCount: t.raw("importCustomers.invalidRowsCount"),
      confirmImport: t("importCustomers.confirmImport"),
      parsing: t("importCustomers.parsing"),
      importing: t("importCustomers.importing"),
      fields: {
        name: t("importCustomers.fields.name"),
        email: t("importCustomers.fields.email"),
        phone: t("importCustomers.fields.phone"),
        documentId: t("importCustomers.fields.documentId"),
        address: t("importCustomers.fields.address"),
        notes: t("importCustomers.fields.notes"),
        avatar: t("importCustomers.fields.avatar"),
      },
    },
  };

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CustomersPageClient
        labels={labels}
        segmentLabels={segmentLabels}
        restaurantId={restaurantId}
      />
    </HydrationBoundary>
  );
}
