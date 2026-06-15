import type { CustomerSavedSegmentSummary } from "@/lib/customers/saved-segments.types";
import type {
  CustomerTagAssignmentSummary,
  CustomerTagSummary,
} from "@/lib/customers/tags.types";

export type { CustomerSavedSegmentSummary, CustomerTagSummary };

export type CustomerOption = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  documentId: string | null;
};

export type CreateCustomerInput = {
  name: string;
  phone?: string;
  email?: string;
  documentId?: string;
  address?: string;
  notes?: string;
  avatar?: string;
  tagIds?: string[];
};

export type UpdateCustomerInput = {
  name?: string;
  phone?: string;
  email?: string;
  documentId?: string;
  address?: string;
  notes?: string;
  avatar?: string;
  tagIds?: string[];
};

export type CustomerSegment =
  | "vip"
  | "frequent"
  | "new"
  | "inactive"
  | "at_risk"
  | "whatsapp"
  | "high_value";

export type CustomerChannel =
  | "whatsapp"
  | "web"
  | "in_person"
  | "delivery"
  | "reservation";

export type CustomerSortField =
  | "last_visit"
  | "total_spend"
  | "order_count"
  | "name"
  | "created_at";

export type CustomerActivityType =
  | "order"
  | "reservation"
  | "inactive"
  | "segment_change"
  | "note"
  | "tag_added"
  | "tag_removed";

export type CustomerOrderSummary = {
  id: string;
  orderNumber: string;
  totalCents: number;
  total: string;
  channel: CustomerChannel;
  createdAt: string;
  createdAtRelative: string;
  status: string;
  itemNames: string[];
};

export type CustomerReservationSummary = {
  id: string;
  guestCount: number;
  status: string;
  scheduledAt: string;
  scheduledAtRelative: string;
};

export type CustomerActivityEvent = {
  id: string;
  customerId: string;
  customerName: string;
  type: CustomerActivityType;
  channel?: CustomerChannel;
  messageKey: string;
  messageValues?: Record<string, string | number>;
  occurredAt: string;
  occurredAtRelative: string;
};

export type CustomerListItem = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  initials: string;
  segment: CustomerSegment;
  segments: CustomerSegment[];
  tags: CustomerTagSummary[];
  savedSegmentNames: string[];
  orderCount: number;
  reservationCount: number;
  totalSpendCents: number;
  totalSpend: string;
  averageTicketCents: number;
  averageTicket: string;
  lastVisitAt: string | null;
  lastVisitRelative: string;
  primaryChannel: CustomerChannel;
  createdAt: string;
  createdAtRelative: string;
  favoriteDishes: string[];
  notes: string | null;
  allergies: string | null;
  frequencyLabel: string;
};

export type CustomerDetail = CustomerListItem & {
  documentId: string | null;
  address: string | null;
  orders: CustomerOrderSummary[];
  reservations: CustomerReservationSummary[];
  activity: CustomerActivityEvent[];
  tagHistory: CustomerTagAssignmentSummary[];
  lastOrderAt: string | null;
  lastOrderAtRelative: string;
  lifetimeValue: string;
  loyaltyPoints: number | null;
};

export type CustomerSegmentCard = {
  id: CustomerSegment | "reservation_frequent";
  nameKey: string;
  descriptionKey: string;
  customerCount: number;
  averageTicket: string;
  lastActivityRelative: string;
};

export type { CustomerSmartSegmentCard, CustomerSmartSegmentsMeta } from "@/lib/customers/smart-segments/types";

export type CustomersKpiTrend = {
  change: string;
  trend: "up" | "down" | "neutral";
};

export type CustomersKpiValues = {
  total: number;
  frequent: number;
  averageTicket: string;
  inactive: number;
  trends: {
    total: CustomersKpiTrend;
    frequent: CustomersKpiTrend;
    averageTicket: CustomersKpiTrend;
    inactive: CustomersKpiTrend;
  };
};

export type CustomerInsight = {
  id: string;
  messageKey: string;
  messageValues?: Record<string, string | number>;
};

export type CustomersListResponse = {
  customers: CustomerListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  segments: CustomerSmartSegmentCard[];
  smartSegmentsMeta: CustomerSmartSegmentsMeta;
  savedSegments: CustomerSavedSegmentSummary[];
  activity: CustomerActivityEvent[];
  insights: CustomerInsight[];
  kpis: CustomersKpiValues;
};

export type CustomersPageData = CustomersListResponse & {
  restaurantId: string;
  currency: string;
  updatedAt: string;
};
