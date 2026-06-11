import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PaymentMethod } from "@/lib/payments/types";
import type { NewOrderLabels } from "./types";

const paymentMethods: PaymentMethod[] = [
  "cash",
  "card",
  "transfer",
  "qr",
  "other",
  "manual_pending",
];

type NewOrderPaymentSectionProps = {
  labels: NewOrderLabels;
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
  error?: string;
};

export function NewOrderPaymentSection({
  labels,
  value,
  onChange,
  error,
}: NewOrderPaymentSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{labels.payment.title}</CardTitle>
        <CardDescription>{labels.payment.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Field>
          <FieldLabel>{labels.payment.label}</FieldLabel>
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {paymentMethods.map((method) => (
                <SelectItem key={method} value={method}>
                  {labels.payment.methods[method]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </Field>
      </CardContent>
    </Card>
  );
}
