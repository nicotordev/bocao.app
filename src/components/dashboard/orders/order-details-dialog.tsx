"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  TbMessageCircle,
  TbPencil,
  TbPrinter,
  TbCopy,
  TbCircleX,
} from "react-icons/tb";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Field, FieldLabel, FieldContent } from "@/components/ui/field";
import {
  useDeleteOrderMutation,
  useDuplicateOrderMutation,
  useUpdateOrderStatusMutation,
  useUpdateOrderMutation,
} from "@/lib/query/orders/orders.mutations";
import { printOrder } from "@/lib/orders/print-order";
import { OrderChannelBadge } from "./order-channel-badge";
import { OrderStatusBadge } from "./order-status-badge";
import type { DashboardOrder, OrdersLabels, OrderStatus } from "./types";
import type { PaymentMethod } from "@/lib/payments/types";
import type { OrderKind } from "@/lib/orders/types";
import { cn } from "@/lib/utils";

type OrderDetailsDialogProps = {
  labels: OrdersLabels;
  restaurantId: string;
  order: DashboardOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditMode?: boolean;
  onEditModeChange?: (isEditing: boolean) => void;
};

const statusOptions: OrderStatus[] = [
  "draft",
  "received",
  "confirmed",
  "preparing",
  "ready",
  "delivered",
];

const statusPillActive: Record<OrderStatus, string> = {
  draft: "border-muted-foreground/50 bg-muted text-muted-foreground shadow-sm ring-2 ring-muted-foreground/20",
  received: "border-secondary/60 bg-secondary/70 text-secondary-foreground shadow-sm ring-2 ring-secondary/25",
  confirmed: "border-chart-3/45 bg-chart-3/15 text-chart-3 shadow-sm ring-2 ring-chart-3/20",
  preparing: "border-chart-2/45 bg-chart-2/15 text-chart-2 shadow-sm ring-2 ring-chart-2/20",
  ready: "border-chart-1/45 bg-chart-1/15 text-chart-1 shadow-sm ring-2 ring-chart-1/20",
  delivered: "border-primary/45 bg-primary/15 text-primary shadow-sm ring-2 ring-primary/20",
  cancelled: "border-destructive/45 bg-destructive/15 text-destructive shadow-sm ring-2 ring-destructive/20",
};

export function OrderDetailsDialog({
  labels,
  restaurantId,
  order,
  open,
  onOpenChange,
  isEditMode = false,
  onEditModeChange,
}: OrderDetailsDialogProps) {
  const tNew = useTranslations("dashboard.orders.new");
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(isEditMode);
  const [isDuplicateConfirmOpen, setIsDuplicateConfirmOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editKind, setEditKind] = useState<OrderKind>("pos");
  const [editTableNumber, setEditTableNumber] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>("manual_pending");

  const updateStatusMutation = useUpdateOrderStatusMutation(restaurantId);
  const updateOrderMutation = useUpdateOrderMutation(restaurantId);
  const duplicateMutation = useDuplicateOrderMutation(restaurantId);
  const deleteMutation = useDeleteOrderMutation(restaurantId);

  useEffect(() => {
    setIsEditing(isEditMode);
  }, [isEditMode]);

  useEffect(() => {
    if (order) {
      setEditKind((order.kind as OrderKind) || "pos");
      setEditTableNumber(order.tableNumber ?? "");
      setEditNotes(order.notes ?? "");
      setEditPaymentMethod(order.payment?.method ?? "manual_pending");
    }
  }, [order, isEditing]);

  const handleEditChange = (editing: boolean) => {
    setIsEditing(editing);
    onEditModeChange?.(editing);
  };

  const handleStatusChange = async (status: OrderStatus) => {
    if (!order) return;
    try {
      await updateStatusMutation.mutateAsync({ orderId: order.id, status });
      toast.success(labels.realtime.connected ? "Status updated" : "Estado actualizado");
    } catch {
      toast.error("Error updating status");
    }
  };

  const handleDelete = async () => {
    if (!order) return;
    try {
      await deleteMutation.mutateAsync(order.id);
      toast.success("Order deleted");
      setIsDeleteConfirmOpen(false);
      onOpenChange(false);
    } catch {
      toast.error("Error deleting order");
    }
  };

  const handleCancel = async () => {
    if (!order) return;
    try {
      await updateStatusMutation.mutateAsync({
        orderId: order.id,
        status: "cancelled",
      });
      toast.success("Order cancelled");
      setIsCancelConfirmOpen(false);
    } catch {
      toast.error("Error cancelling order");
    }
  };

  const handlePrint = () => {
    if (!order) return;
    try {
      printOrder(order, labels);
    } catch {
      toast.error("Error printing order");
    }
  };

  const handleDuplicate = async () => {
    if (!order) return;
    try {
      const result = await duplicateMutation.mutateAsync(order.id);
      toast.success("Order duplicated");
      setIsDuplicateConfirmOpen(false);
      if (result.order) {
        router.push(`/dashboard/orders?created=${encodeURIComponent(result.order.id)}`);
      }
    } catch {
      toast.error("Error duplicating order");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    try {
      await updateOrderMutation.mutateAsync({
        orderId: order.id,
        input: {
          kind: editKind,
          tableNumber: editTableNumber.trim() || undefined,
          notes: editNotes.trim(),
          paymentMethod: editPaymentMethod,
        },
      });
      toast.success("Order updated successfully");
      handleEditChange(false);
    } catch {
      toast.error("Error updating order");
    }
  };

  const isUpdatingStatus = updateStatusMutation.isPending;
  const isUpdatingOrder = updateOrderMutation.isPending;
  const isDuplicating = duplicateMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const canCancelOrder = order?.status !== "cancelled";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid max-h-[min(92vh,860px)] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-2xl">
        {order ? (
          <DialogHeader className="shrink-0 border-b border-border px-6 py-5 text-left">
            <DialogTitle>
              {labels.drawer.title} {order.id}
            </DialogTitle>
            <DialogDescription>{labels.drawer.description}</DialogDescription>
          </DialogHeader>
        ) : (
          <DialogHeader className="sr-only">
            <DialogTitle>{labels.drawer.title}</DialogTitle>
            <DialogDescription>{labels.drawer.description}</DialogDescription>
          </DialogHeader>
        )}

        {order ? (
          isEditing ? (
            <div className="min-h-0 overflow-y-auto">
              <form onSubmit={handleSave} className="space-y-6 px-6 py-6">
                <section className="rounded-3xl border border-border bg-card p-4 space-y-4">
                  <h3 className="font-heading font-medium">{labels.drawer.general}</h3>
                  
                  <Field>
                    <FieldLabel htmlFor="edit-kind">{tNew("channel.title")}</FieldLabel>
                    <FieldContent>
                      <NativeSelect
                        id="edit-kind"
                        value={editKind}
                        onChange={(e) => setEditKind(e.target.value as OrderKind)}
                        className="w-full"
                      >
                        <NativeSelectOption value="dineIn">{tNew("orderKinds.dineIn")}</NativeSelectOption>
                        <NativeSelectOption value="takeout">{tNew("orderKinds.takeout")}</NativeSelectOption>
                        <NativeSelectOption value="delivery">{tNew("orderKinds.delivery")}</NativeSelectOption>
                        <NativeSelectOption value="whatsapp">{tNew("orderKinds.whatsapp")}</NativeSelectOption>
                        <NativeSelectOption value="pos">{tNew("orderKinds.pos")}</NativeSelectOption>
                      </NativeSelect>
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="edit-table">{tNew("table.title")}</FieldLabel>
                    <FieldContent>
                      <Input
                        id="edit-table"
                        value={editTableNumber}
                        onChange={(e) => setEditTableNumber(e.target.value)}
                        placeholder={tNew("table.numberPlaceholder")}
                      />
                    </FieldContent>
                  </Field>
                </section>

                <section className="rounded-3xl border border-border bg-card p-4 space-y-4">
                  <h3 className="font-heading font-medium">{tNew("payment.title")}</h3>
                  
                  <Field>
                    <FieldLabel htmlFor="edit-payment">{tNew("payment.label")}</FieldLabel>
                    <FieldContent>
                      <NativeSelect
                        id="edit-payment"
                        value={editPaymentMethod}
                        onChange={(e) => setEditPaymentMethod(e.target.value as PaymentMethod)}
                        className="w-full"
                      >
                        <NativeSelectOption value="cash">{tNew("payment.methods.cash")}</NativeSelectOption>
                        <NativeSelectOption value="card">{tNew("payment.methods.card")}</NativeSelectOption>
                        <NativeSelectOption value="transfer">{tNew("payment.methods.transfer")}</NativeSelectOption>
                        <NativeSelectOption value="qr">{tNew("payment.methods.qr")}</NativeSelectOption>
                        <NativeSelectOption value="other">{tNew("payment.methods.other")}</NativeSelectOption>
                        <NativeSelectOption value="manual_pending">{tNew("payment.methods.manualPending")}</NativeSelectOption>
                      </NativeSelect>
                    </FieldContent>
                  </Field>
                </section>

                <section className="rounded-3xl border border-border bg-card p-4 space-y-4">
                  <h3 className="font-heading font-medium">{labels.drawer.notes}</h3>
                  
                  <Field>
                    <FieldLabel htmlFor="edit-notes" className="sr-only">{labels.drawer.notes}</FieldLabel>
                    <FieldContent>
                      <Textarea
                        id="edit-notes"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder={tNew("notes.placeholder")}
                      />
                    </FieldContent>
                  </Field>
                </section>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleEditChange(false)}
                  >
                    {labels.actions.cancel}
                  </Button>
                  <Button type="submit" disabled={isUpdatingOrder}>
                    {isUpdatingOrder ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="min-h-0 overflow-y-auto">
              <div className="space-y-6 px-6 py-6">
                <section className="rounded-3xl border border-border bg-card p-4">
                  <h3 className="font-heading font-medium">{labels.drawer.general}</h3>
                  <div className="mt-4 grid gap-3 text-sm">
                    <DetailRow label={labels.drawer.number} value={order.id} />
                    <DetailRow label={labels.drawer.date} value={order.createdAt} />
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">{labels.table.status}</span>
                      <OrderStatusBadge status={order.status} labels={labels.statuses} />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">{labels.table.channel}</span>
                      <OrderChannelBadge
                        channel={order.channel}
                        labels={labels.channels}
                        whatsappLabel={labels.accessibility.whatsappOrder}
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-border bg-card p-4">
                  <h3 className="font-heading font-medium">{labels.drawer.customer}</h3>
                  <div className="mt-4 grid gap-3 text-sm">
                    <DetailRow label={labels.table.customer} value={order.customerName} />
                    <DetailRow label={labels.drawer.phone} value={order.phone} />
                    <DetailRow label={labels.drawer.history} value={order.history} />
                  </div>
                  {order.channel === "whatsapp" ? (
                    <div className="mt-4 flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
                      <TbMessageCircle className="size-4" aria-hidden />
                      {labels.channels.whatsapp}
                    </div>
                  ) : null}
                </section>

                <section className="rounded-3xl border border-border bg-card p-4">
                  <h3 className="font-heading font-medium">{labels.drawer.products}</h3>
                  <div className="mt-4 space-y-3">
                    {order.items.map((item) => (
                      <div
                        key={`${item.name}-${item.price}`}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                        </div>
                        <span className="font-medium">{item.price}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-3xl border border-border bg-card p-4">
                  <h3 className="font-heading font-medium">{labels.drawer.summary}</h3>
                  <div className="mt-4 grid gap-3 text-sm">
                    <DetailRow label={labels.drawer.subtotal} value={order.summary.subtotal} />
                    <DetailRow label={labels.drawer.taxes} value={order.summary.taxes} />
                    <Separator />
                    <DetailRow label={labels.drawer.total} value={order.summary.total} strong />
                  </div>
                </section>

                <section className="rounded-3xl border border-border bg-card p-4">
                  <h3 className="font-heading font-medium">{labels.drawer.timeline}</h3>
                  <ol className="mt-4 space-y-3">
                    {order.timeline.map((event) => (
                      <li key={`${event.time}-${event.titleKey}`} className="flex gap-3 text-sm">
                        <span className="text-muted-foreground">{event.time}</span>
                        <div>
                          <p className="font-medium">
                            {labels.timeline[
                              event.titleKey as keyof OrdersLabels["timeline"]
                            ]}
                          </p>
                          {event.actor ? (
                            <p className="text-xs text-muted-foreground">{event.actor}</p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>

                <section className="rounded-3xl border border-border bg-card p-4">
                  <h3 className="font-heading font-medium">{labels.drawer.notes}</h3>
                  <p className="mt-3 text-sm text-muted-foreground">{order.notes}</p>
                </section>

                <section className="overflow-hidden rounded-3xl border border-border/70 bg-linear-to-br from-muted/30 via-card to-card p-4 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-heading text-base font-semibold">
                      {labels.table.actions}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 flex-1 gap-2 rounded-2xl"
                      onClick={() => handleEditChange(true)}
                    >
                      <TbPencil className="size-4" aria-hidden />
                      {labels.actions.edit}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 flex-1 gap-2 rounded-2xl"
                      onClick={handlePrint}
                    >
                      <TbPrinter className="size-4" aria-hidden />
                      {labels.actions.print}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 flex-1 gap-2 rounded-2xl"
                      disabled={isDuplicating}
                      onClick={() => setIsDuplicateConfirmOpen(true)}
                    >
                      <TbCopy className="size-4" aria-hidden />
                      {isDuplicating ? "Duplicating..." : labels.actions.duplicate}
                    </Button>
                  </div>

                  <Separator className="opacity-60" />

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground/80">
                      {labels.actions.changeStatus}
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {statusOptions.map((status) => {
                        const isSelected = order.status === status;

                        return (
                          <button
                            key={status}
                            type="button"
                            disabled={isUpdatingStatus}
                            onClick={() => handleStatusChange(status)}
                            className={cn(
                              "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium transition duration-150",
                              isSelected
                                ? statusPillActive[status]
                                : "border-border/50 bg-background/50 text-muted-foreground hover:border-border hover:bg-muted/35 hover:text-foreground",
                            )}
                          >
                            <span
                              className={cn(
                                "size-2 rounded-full",
                                isSelected ? "bg-current" : "bg-muted-foreground/40",
                              )}
                            />
                            {labels.statuses[status]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Separator className="opacity-60" />

                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      variant="ghost"
                      className="h-10 w-full gap-2 rounded-2xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setIsCancelConfirmOpen(true)}
                      disabled={isUpdatingStatus || !canCancelOrder}
                    >
                      <TbCircleX className="size-4" aria-hidden />
                      {labels.actions.cancel}
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-10 w-full gap-2 rounded-2xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setIsDeleteConfirmOpen(true)}
                      disabled={isDeleting}
                    >
                      <TbCircleX className="size-4" aria-hidden />
                      {labels.actions.delete}
                    </Button>
                  </div>
                </section>
              </div>
            </div>
          )
        ) : null}
      </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={isDuplicateConfirmOpen}
        onOpenChange={setIsDuplicateConfirmOpen}
        title={labels.actions.duplicate}
        description={labels.drawer.confirmDuplicate}
        confirmLabel={labels.actions.duplicate}
        cancelLabel={labels.actions.cancel}
        onConfirm={() => {
          void handleDuplicate();
        }}
        isPending={isDuplicating}
      />
      <ConfirmDialog
        open={isCancelConfirmOpen}
        onOpenChange={setIsCancelConfirmOpen}
        title={labels.actions.cancel}
        description={labels.drawer.confirmCancel}
        confirmLabel={labels.actions.cancel}
        cancelLabel={labels.actions.cancel}
        onConfirm={() => {
          void handleCancel();
        }}
        isPending={isUpdatingStatus}
      />
      <ConfirmDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title={labels.actions.delete}
        description={labels.drawer.confirmDelete}
        confirmLabel={labels.actions.delete}
        cancelLabel={labels.actions.cancel}
        onConfirm={() => {
          void handleDelete();
        }}
        isPending={isDeleting}
      />
    </>
  );
}

function DetailRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-semibold" : "font-medium"}>{value}</span>
    </div>
  );
}
