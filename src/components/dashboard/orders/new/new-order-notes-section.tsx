import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import type { NewOrderLabels } from "./types";

type NewOrderNotesSectionProps = {
  labels: NewOrderLabels;
  value: string;
  error?: string;
  onChange: (value: string) => void;
};

export function NewOrderNotesSection({
  labels,
  value,
  error,
  onChange,
}: NewOrderNotesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{labels.notes.title}</CardTitle>
        <CardDescription>{labels.notes.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Field>
          <FieldLabel htmlFor="order-notes">{labels.notes.title}</FieldLabel>
          <Textarea
            id="order-notes"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={labels.notes.placeholder}
            rows={4}
            aria-invalid={Boolean(error)}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </Field>
      </CardContent>
    </Card>
  );
}
