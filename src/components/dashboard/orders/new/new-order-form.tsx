"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createOrderBodySchema } from "@/lib/orders/schemas";
import type { CreateOrderIntent } from "@/lib/orders/types";
import { useCreateOrderMutation } from "@/lib/query/orders/orders.mutations";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NewOrderChannelSection } from "./new-order-channel-section";
import { NewOrderCustomerSection } from "./new-order-customer-section";
import { NewOrderItemsSection } from "./new-order-items-section";
import { NewOrderNotesSection } from "./new-order-notes-section";
import { NewOrderPaymentSection } from "./new-order-payment-section";
import { NewOrderSummaryCard } from "./new-order-summary-card";
import type {
  NewOrderFormValues,
  NewOrderLineItem,
  NewOrderNewCustomerInput,
  NewOrderPageClientProps,
  NewOrderSelectedCustomer,
} from "./types";

type FormErrors = {
  customers?: string;
  tableNumber?: string;
  items?: string;
  notes?: string;
  paymentMethod?: string;
};

function createLineItemId() {
  return crypto.randomUUID();
}

function createCustomerKey() {
  return crypto.randomUUID();
}

type NewOrderFormProps = Pick<
  NewOrderPageClientProps,
  | "labels"
  | "restaurantId"
  | "currency"
  | "menuItems"
  | "customers"
  | "floorPlanSurfaces"
  | "occupiedTableNumbers"
  | "initialTableNumber"
  | "localeOptions"
> & {
  onSuccess?: (orderId: string) => void;
  formClassName?: string;
};

export function NewOrderForm({
  labels,
  restaurantId,
  currency,
  menuItems,
  customers,
  floorPlanSurfaces,
  occupiedTableNumbers,
  initialTableNumber,
  localeOptions,
  onSuccess,
  formClassName,
}: NewOrderFormProps) {
  const router = useRouter();
  const createOrderMutation = useCreateOrderMutation(restaurantId);
  const [values, setValues] = useState<NewOrderFormValues>({
    selectedCustomers: [],
    tableNumber: initialTableNumber ?? "",
    kind: "pos",
    notes: "",
    items: [],
    paymentMethod: "manual_pending",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [pendingIntent, setPendingIntent] = useState<CreateOrderIntent | null>(
    null,
  );

  const isSubmitting = createOrderMutation.isPending;

  const buildPayload = (intent: CreateOrderIntent) => ({
    customers: values.selectedCustomers.map((customer) => ({
      id: customer.id,
      name: customer.name.trim(),
      phone: customer.phone.trim() || undefined,
      email: customer.email.trim() || undefined,
      documentId: customer.documentId.trim() || undefined,
      address: customer.address.trim() || undefined,
      notes: customer.notes.trim() || undefined,
    })),
    tableNumber:
      values.kind === "dineIn" || values.kind === "pos"
        ? values.tableNumber.trim() || undefined
        : undefined,
    kind: values.kind,
    notes: values.notes.trim(),
    items: values.items.map((item) => ({
      menuItemId: item.menuItemId,
      name: item.name.trim(),
      quantity: item.quantity,
      priceCents: item.priceCents,
      imageUrls: item.imageUrls.length ? item.imageUrls : undefined,
      customization: item.customization,
    })),
    paymentMethod: values.paymentMethod,
    intent,
  });

  function updateField<K extends keyof NewOrderFormValues>(
    field: K,
    value: NewOrderFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));

    if (field === "items") {
      setErrors((current) => ({ ...current, items: undefined }));
    }

    if (field === "tableNumber") {
      setErrors((current) => ({ ...current, tableNumber: undefined }));
    }

    if (field === "selectedCustomers") {
      setErrors((current) => ({ ...current, customers: undefined }));
    }

    if (field === "notes") {
      setErrors((current) => ({ ...current, notes: undefined }));
    }

    if (field === "paymentMethod") {
      setErrors((current) => ({ ...current, paymentMethod: undefined }));
    }
  }

  function syncExistingCustomers(
    nextExisting: NewOrderPageClientProps["customers"],
  ) {
    setValues((current) => {
      const preservedNewCustomers = current.selectedCustomers.filter(
        (customer) => customer.source === "new",
      );
      const nextExistingCustomers: NewOrderSelectedCustomer[] =
        nextExisting.map((customer) => ({
          key: customer.id,
          id: customer.id,
          name: customer.name,
          phone: customer.phone ?? "",
          email: customer.email ?? "",
          documentId: customer.documentId ?? "",
          address: "",
          notes: "",
          source: "existing",
        }));

      return {
        ...current,
        selectedCustomers: [...nextExistingCustomers, ...preservedNewCustomers],
      };
    });
    setErrors((current) => ({ ...current, customers: undefined }));
  }

  function removeCustomer(key: string) {
    setValues((current) => ({
      ...current,
      selectedCustomers: current.selectedCustomers.filter(
        (customer) => customer.key !== key,
      ),
    }));
  }

  function addNewCustomer(customer: NewOrderNewCustomerInput) {
    setValues((current) => ({
      ...current,
      selectedCustomers: [
        ...current.selectedCustomers,
        {
          key: createCustomerKey(),
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          documentId: customer.documentId,
          address: customer.address,
          notes: customer.notes,
          source: "new",
        },
      ],
    }));
    setErrors((current) => ({
      ...current,
      customers: undefined,
    }));
  }

  function addMenuItem(menuItem: NewOrderPageClientProps["menuItems"][number]) {
    const hasActiveFlow =
      menuItem.purchaseFlow?.isActive &&
      (menuItem.purchaseFlow.steps.length ?? 0) > 0;

    if (hasActiveFlow) {
      return;
    }

    setValues((current) => {
      const existing = current.items.find(
        (item) => item.menuItemId === menuItem.id && !item.customization,
      );

      if (existing) {
        return {
          ...current,
          items: current.items.map((item) =>
            item.id === existing.id
              ? { ...item, quantity: Math.min(99, item.quantity + 1) }
              : item,
          ),
        };
      }

      return {
        ...current,
        items: [
          ...current.items,
          {
            id: createLineItemId(),
            menuItemId: menuItem.id,
            name: menuItem.name,
            quantity: 1,
            priceCents: menuItem.priceCents,
            imageUrls: [...menuItem.images],
          },
        ],
      };
    });
    setErrors((current) => ({ ...current, items: undefined }));
  }

  function addConfiguredMenuItem(
    menuItem: NewOrderPageClientProps["menuItems"][number],
    result: {
      name: string;
      priceCents: number;
      customization: NewOrderLineItem["customization"];
    },
  ) {
    setValues((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          id: createLineItemId(),
          menuItemId: menuItem.id,
          name: result.name,
          quantity: 1,
          priceCents: result.priceCents,
          imageUrls: [...menuItem.images],
          customization: result.customization,
        },
      ],
    }));
    setErrors((current) => ({ ...current, items: undefined }));
  }

  function addCustomItem(
    name: string,
    priceCents: number,
    quantity: number,
    imageUrls: string[],
  ) {
    setValues((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          id: createLineItemId(),
          name,
          quantity,
          priceCents,
          imageUrls: [...imageUrls],
        },
      ],
    }));
    setErrors((current) => ({ ...current, items: undefined }));
  }

  function removeItem(id: string) {
    setValues((current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== id),
    }));
  }

  function updateItem(
    id: string,
    updater: (item: NewOrderLineItem) => NewOrderLineItem,
  ) {
    setValues((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === id ? updater(item) : item,
      ),
    }));
  }

  function validateForm(intent: CreateOrderIntent): boolean {
    const parsed = createOrderBodySchema.safeParse(buildPayload(intent));
    const nextErrors: FormErrors = {};

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (field === "customers" && !nextErrors.customers) {
          nextErrors.customers = labels.validation.customers;
        }

        if (field === "tableNumber" && !nextErrors.tableNumber) {
          nextErrors.tableNumber = labels.validation.tableNumber;
        }

        if (field === "items" && !nextErrors.items) {
          nextErrors.items = labels.validation.items;
        }

        if (field === "notes" && !nextErrors.notes) {
          nextErrors.notes = labels.validation.notes;
        }

        if (field === "paymentMethod" && !nextErrors.paymentMethod) {
          nextErrors.paymentMethod = labels.validation.paymentMethod;
        }
      }
    }

    const hasInvalidCustomItem = values.items.some(
      (item) => !item.menuItemId && item.name.trim().length === 0,
    );

    if (hasInvalidCustomItem) {
      nextErrors.items = labels.validation.itemName;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0 && parsed.success;
  }

  async function submitWithIntent(intent: CreateOrderIntent) {
    setPendingIntent(intent);

    if (!validateForm(intent)) {
      setPendingIntent(null);
      return;
    }

    try {
      const response = await createOrderMutation.mutateAsync(
        buildPayload(intent),
      );
      toast.success(
        intent === "draft"
          ? labels.feedback.draftSuccess
          : labels.feedback.success,
      );

      if (onSuccess) {
        onSuccess(response.order.id);
        return;
      }

      router.push(
        `/dashboard/orders?created=${encodeURIComponent(response.order.id)}`,
      );
    } catch {
      toast.error(labels.feedback.error);
    } finally {
      setPendingIntent(null);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submitWithIntent("confirm");
      }}
      className={cn(
        "grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]",
        formClassName,
      )}
    >
      <div className="space-y-6">
        <NewOrderChannelSection
          labels={labels}
          value={values.kind}
          onChange={(kind) => updateField("kind", kind)}
        />
        <NewOrderCustomerSection
          labels={labels}
          customers={customers}
          kind={values.kind}
          floorPlanSurfaces={floorPlanSurfaces}
          occupiedTableNumbers={occupiedTableNumbers}
          values={{
            selectedCustomers: values.selectedCustomers,
            tableNumber: values.tableNumber,
          }}
          errors={errors}
          onAddExistingCustomers={syncExistingCustomers}
          onAddNewCustomer={addNewCustomer}
          onRemoveCustomer={removeCustomer}
          onTableNumberChange={(tableNumber) =>
            updateField("tableNumber", tableNumber)
          }
        />
        <NewOrderItemsSection
          labels={labels}
          currency={currency}
          restaurantId={restaurantId}
          localeOptions={localeOptions}
          menuItems={menuItems}
          items={values.items}
          error={errors.items}
          onAddFromMenu={addMenuItem}
          onAddConfiguredMenuItem={addConfiguredMenuItem}
          onAddCustom={addCustomItem}
          onRemove={removeItem}
          onUpdateQuantity={(id, quantity) =>
            updateItem(id, (item) => ({ ...item, quantity }))
          }
        />
        <NewOrderNotesSection
          labels={labels}
          value={values.notes}
          error={errors.notes}
          onChange={(notes) => updateField("notes", notes)}
        />
        <NewOrderPaymentSection
          labels={labels}
          value={values.paymentMethod}
          onChange={(paymentMethod) =>
            updateField("paymentMethod", paymentMethod)
          }
          error={errors.paymentMethod}
        />
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-w-36"
            disabled={isSubmitting}
            onClick={() => {
              void submitWithIntent("draft");
            }}
          >
            {isSubmitting && pendingIntent === "draft"
              ? labels.actions.savingDraft
              : labels.actions.saveDraft}
          </Button>
          <Button type="submit" className="min-w-40" disabled={isSubmitting}>
            {isSubmitting && pendingIntent === "confirm"
              ? labels.actions.confirmingOrder
              : labels.actions.confirmOrder}
          </Button>
        </div>
      </div>

      <NewOrderSummaryCard
        labels={labels}
        currency={currency}
        items={values.items}
        paymentMethod={values.paymentMethod}
      />
    </form>
  );
}
