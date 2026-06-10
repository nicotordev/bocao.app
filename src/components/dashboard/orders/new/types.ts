import type { CustomerOption } from "@/lib/customers/types";
import type {
  DiningSurfaceRecord,
  TableOccupancy,
} from "@/lib/floor-plan/types";
import type { MenuItemWithFlowOption } from "@/lib/product-flow/types";
import type { OrderLineCustomization } from "@/lib/product-flow/types";
import type { ProductFlowWizardLabels } from "./product-purchase-wizard";
import type { OrderChannel } from "@/lib/orders/types";
import type { MenuLocaleOption } from "@/components/dashboard/menu/types";

export type NewOrderLineItem = {
  id: string;
  menuItemId?: string;
  name: string;
  quantity: number;
  priceCents: number;
  imageUrls: string[];
  customization?: OrderLineCustomization;
};

export type NewOrderSelectedCustomer = {
  key: string;
  id?: string;
  name: string;
  phone: string;
  email: string;
  documentId: string;
  address: string;
  notes: string;
  source: "existing" | "new";
};

export type NewOrderNewCustomerInput = {
  name: string;
  phone: string;
  email: string;
  documentId: string;
  address: string;
  notes: string;
  avatar: string;
};

export type NewOrderFormValues = {
  selectedCustomers: NewOrderSelectedCustomer[];
  tableNumber: string;
  channel: OrderChannel;
  notes: string;
  items: NewOrderLineItem[];
};

export type NewOrderLabels = {
  optional: string;
  required: string;
  header: {
    title: string;
    subtitle: string;
  };
  breadcrumb: {
    orders: string;
    new: string;
  };
  actions: {
    back: string;
    submit: string;
    submitting: string;
    addItem: string;
    removeItem: string;
    addCustomer: string;
    removeCustomer: string;
  };
  customer: {
    title: string;
    description: string;
    name: string;
    namePlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    documentId: string;
    documentIdPlaceholder: string;
    address: string;
    addressPlaceholder: string;
    notes: string;
    notesPlaceholder: string;
    searchPlaceholder: string;
    noResults: string;
    selectedHint: string;
    selectedTitle: string;
    emptySelection: string;
    picker: {
      title: string;
      description: string;
      addCustomer: string;
      addSuccess: string;
    };
  };
  table: {
    title: string;
    description: string;
    number: string;
    numberPlaceholder: string;
    pickerHint: string;
    pickerFree: string;
    pickerOccupied: string;
    pickerSelected: string;
    configureFloorPlan: string;
  };
  channel: {
    title: string;
    description: string;
    label: string;
  };
  items: {
    title: string;
    description: string;
    menuLabel: string;
    menuPlaceholder: string;
    quantity: string;
    price: string;
    lineTotal: string;
    empty: string;
    emptyDescription: string;
    photos: string;
    picker: {
      title: string;
      description: string;
      addProduct: string;
      customProduct: string;
      emptyMenuTitle: string;
      emptyMenuDescription: string;
      footerHint: string;
      hasFlow: string;
      customProductTitle: string;
      customProductDescription: string;
      customNameLabel: string;
      customNamePlaceholder: string;
      customPriceLabel: string;
      customQuantityLabel: string;
      addCustomSuccess: string;
    };
    customization: string;
  };
  flowWizard: ProductFlowWizardLabels;
  photos: {
    addPhoto: string;
    removePhoto: string;
    uploading: string;
    uploadError: string;
    invalidImageType: string;
    imageTooLarge: string;
    storageNotConfigured: string;
    moveEarlier: string;
    moveLater: string;
    photoSortOrder: string;
  };
  notes: {
    title: string;
    description: string;
    placeholder: string;
  };
  summary: {
    title: string;
    subtotal: string;
    taxes: string;
    total: string;
    taxNote: string;
  };
  channels: Record<OrderChannel, string>;
  validation: {
    customers: string;
    tableNumber: string;
    draftCustomerName: string;
    items: string;
    itemName: string;
    itemPrice: string;
    itemQuantity: string;
  };
  feedback: {
    success: string;
    error: string;
  };
  permissions: {
    deniedTitle: string;
    deniedDescription: string;
  };
};

export type NewOrderPageClientProps = {
  labels: NewOrderLabels;
  restaurantId: string;
  currency: string;
  canCreate: boolean;
  menuItems: MenuItemWithFlowOption[];
  customers: CustomerOption[];
  floorPlanSurface: DiningSurfaceRecord | null;
  occupiedTableNumbers: TableOccupancy;
  initialTableNumber?: string;
  localeOptions: MenuLocaleOption[];
};
