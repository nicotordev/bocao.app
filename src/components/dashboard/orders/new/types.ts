import type { CustomerOption } from "@/lib/customers/types";
import type {
  DiningSurfaceRecord,
  TableOccupancy,
} from "@/lib/floor-plan/types";
import type { MenuItemWithFlowOption } from "@/lib/product-flow/types";
import type { OrderLineCustomization } from "@/lib/product-flow/types";
import type { ProductFlowWizardLabels } from "./product-purchase-wizard";
import type { OrderKind, CreateOrderIntent } from "@/lib/orders/types";
import type { PaymentMethod } from "@/lib/payments/types";
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
  kind: OrderKind;
  notes: string;
  items: NewOrderLineItem[];
  paymentMethod: PaymentMethod;
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
    saveDraft: string;
    savingDraft: string;
    confirmOrder: string;
    confirmingOrder: string;
    cancel: string;
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
    expandPicker: string;
    pickerDialogTitle: string;
    pickerDialogDescription: string;
    floor: string;
    floorUp: string;
    floorDown: string;
    switchFloor: string;
    selectSurface: string;
    unconfiguredFloor: string;
    surfaceNameBasement: string;
    surfaceNameGround: string;
    surfaceNameFloor: string;
  };
  channel: {
    title: string;
    description: string;
    label: string;
  };
  orderKinds: Record<OrderKind, string>;
  payment: {
    title: string;
    description: string;
    label: string;
    methods: Record<PaymentMethod, string>;
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
    paymentMethod: string;
  };
  validation: {
    customers: string;
    tableNumber: string;
    draftCustomerName: string;
    items: string;
    itemName: string;
    itemPrice: string;
    itemQuantity: string;
    notes: string;
    paymentMethod: string;
  };
  feedback: {
    success: string;
    draftSuccess: string;
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
  floorPlanSurfaces: DiningSurfaceRecord[];
  occupiedTableNumbers: TableOccupancy;
  initialTableNumber?: string;
  localeOptions: MenuLocaleOption[];
};
