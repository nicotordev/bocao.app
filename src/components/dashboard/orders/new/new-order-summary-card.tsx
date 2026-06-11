import { computeOrderTotals } from "@/lib/orders/compute-order-totals";
import { formatCurrency } from "@/lib/orders/currency";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { PaymentMethod } from "@/lib/payments/types";
import type { NewOrderLineItem, NewOrderLabels } from "./types";

type NewOrderSummaryCardProps = {
  labels: NewOrderLabels;
  currency: string;
  items: NewOrderLineItem[];
  paymentMethod: PaymentMethod;
};

export function NewOrderSummaryCard({
  labels,
  currency,
  items,
  paymentMethod,
}: NewOrderSummaryCardProps) {
  const totals = computeOrderTotals(items);

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle>{labels.summary.title}</CardTitle>
        <CardDescription>{labels.summary.taxNote}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <SummaryRow
            label={labels.summary.subtotal}
            value={formatCurrency(totals.subtotalCents, currency)}
          />
          <SummaryRow
            label={labels.summary.taxes}
            value={formatCurrency(totals.taxCents, currency)}
          />
        </div>
        <Separator />
        <SummaryRow
          label={labels.summary.total}
          value={formatCurrency(totals.totalCents, currency)}
          emphasis
        />
        <Separator />
        <SummaryRow
          label={labels.summary.paymentMethod}
          value={labels.payment.methods[paymentMethod]}
        />
      </CardContent>
    </Card>
  );
}

function SummaryRow({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={emphasis ? "font-medium" : "text-muted-foreground"}>
        {label}
      </span>
      <span className={emphasis ? "font-heading text-lg font-semibold" : ""}>
        {value}
      </span>
    </div>
  );
}
