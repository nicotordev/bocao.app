import type { CustomerFormDialogLabels } from "@/lib/customers/customer-form-labels";
import type {
  CustomerChannel,
  CustomerSegment,
  CustomerSortField,
} from "@/lib/customers/types";

export type CustomersLabels = {
  header: {
    title: string;
    subtitle: string;
  };
  actions: {
    newCustomer: string;
    importCsv: string;
    export: string;
    createCampaign: string;
    viewProfile: string;
    edit: string;
    addTag: string;
    archive: string;
    delete: string;
    editProfile: string;
    sendWhatsapp: string;
    addNote: string;
    viewCustomers: string;
    suggestedCampaign: string;
    clearFilters: string;
    exportSuccess: string;
    exportEmpty: string;
    comingSoon: string;
  };
  kpis: {
    total: string;
    frequent: string;
    averageTicket: string;
    inactive: string;
    notAvailable: string;
  };
  toolbar: {
    search: string;
    searchPlaceholder: string;
    segment: string;
    channel: string;
    sort: string;
    filters: string;
  };
  segments: {
    all: string;
    vip: string;
    frequent: string;
    new: string;
    inactive: string;
    atRisk: string;
    whatsapp: string;
    highValue: string;
    cards: Record<
      | "vip"
      | "frequent"
      | "new"
      | "inactive"
      | "atRisk"
      | "whatsapp"
      | "highValue"
      | "reservationFrequent",
      { name: string; description: string }
    >;
  };
  channels: Record<CustomerChannel | "all", string>;
  sort: Record<CustomerSortField, string>;
  tabs: {
    customers: string;
    segments: string;
    activity: string;
  };
  table: {
    customer: string;
    contact: string;
    segment: string;
    orders: string;
    totalSpend: string;
    averageTicket: string;
    lastVisit: string;
    channel: string;
    actions: string;
  };
  drawer: {
    title: string;
    description: string;
    profile: string;
    metrics: string;
    preferences: string;
    history: string;
    name: string;
    phone: string;
    email: string;
    channel: string;
    createdAt: string;
    lastVisit: string;
    orders: string;
    reservations: string;
    totalSpend: string;
    averageTicket: string;
    frequency: string;
    favoriteDishes: string;
    notes: string;
    allergies: string;
    tags: string;
    noNotes: string;
    noAllergies: string;
    noTags: string;
    noFavoriteDishes: string;
    frequencyLevels: {
      high: string;
      medium: string;
      low: string;
      none: string;
    };
    tabs: {
      orders: string;
      reservations: string;
      activity: string;
      notes: string;
    };
  };
  insights: {
    title: string;
    subtitle: string;
  };
  activity: {
    title: string;
    subtitle: string;
  };
  empty: {
    title: string;
    description: string;
    cta: string;
  };
  bulkActions: {
    selectedCount: string;
    clearSelection: string;
    export: string;
    createCampaign: string;
    saveToSegment: string;
    archive: string;
    delete: string;
  };
  deleteDialog: {
    title: string;
    titleBulk: string;
    description: string;
    descriptionBulk: string;
    confirm: string;
    cancel: string;
    success: string;
    successBulk: string;
    error: string;
  };
  savedSegments: {
    title: string;
    subtitle: string;
    smartTitle: string;
    smartSubtitle: string;
    create: string;
    createTitle: string;
    createDescription: string;
    saveTitle: string;
    saveDescription: string;
    addCustomersTitle: string;
    addCustomersDescription: string;
    addCustomersDescriptionFallback: string;
    name: string;
    namePlaceholder: string;
    description: string;
    descriptionPlaceholder: string;
    noDescription: string;
    saveMode: string;
    createNew: string;
    addToExisting: string;
    segment: string;
    selectSegment: string;
    search: string;
    searchPlaceholder: string;
    empty: string;
    selectedCount: string;
    selectAllCustomers: string;
    importCustomer: string;
    addCustomers: string;
    cancel: string;
    save: string;
    created: string;
    addedToExisting: string;
    saveError: string;
    nameRequired: string;
    noCustomersSelected: string;
  };
  accessibility: {
    openActions: string;
    openDetails: string;
    openFilters: string;
    selectCustomer: string;
    selectAllCustomers: string;
  };
  pagination: {
    previous: string;
    next: string;
    page: string;
    of: string;
  };
  formDialog: CustomerFormDialogLabels;
  feedback: {
    createError: string;
    deleteError: string;
  };
  importCustomers: {
    button: string;
    title: string;
    description: string;
    importMode: string;
    reuseFromRestaurants: string;
    importFromFile: string;
    searchPlaceholder: string;
    empty: string;
    error: string;
    loading: string;
    selectedCount: string;
    importSelected: string;
    cancel: string;
    importedSuccessfully: string;
    importFailed: string;
    organization: string;
    restaurant: string;
    customer: string;
    noCustomersSelected: string;
    noReusableCustomersFound: string;
    allOrganizations: string;
    allRestaurants: string;
    uploadFile: string;
    downloadTemplate: string;
    previewImport: string;
    mapColumns: string;
    invalidFileFormat: string;
    invalidRows: string;
    importConfirmed: string;
    importCompleted: string;
    fileTooLarge: string;
    emptyFile: string;
    noValidRows: string;
    dropFileHint: string;
    row: string;
    errors: string;
    validRows: string;
    invalidRowsCount: string;
    confirmImport: string;
    parsing: string;
    importing: string;
    fields: {
      name: string;
      email: string;
      phone: string;
      documentId: string;
      address: string;
      notes: string;
      avatar: string;
    };
  };
};

export type CustomerSegmentLabelMap = Record<CustomerSegment, string>;
