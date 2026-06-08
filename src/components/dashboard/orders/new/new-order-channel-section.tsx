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
import type { OrderChannel } from "@/lib/orders/types";
import type { NewOrderLabels } from "./types";

const channelOptions: OrderChannel[] = [
  "whatsapp",
  "web",
  "dineIn",
  "uberEats",
  "rappi",
];

type NewOrderChannelSectionProps = {
  labels: NewOrderLabels;
  value: OrderChannel;
  onChange: (value: OrderChannel) => void;
};

export function NewOrderChannelSection({
  labels,
  value,
  onChange,
}: NewOrderChannelSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{labels.channel.title}</CardTitle>
        <CardDescription>{labels.channel.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Field>
          <FieldLabel>{labels.channel.label}</FieldLabel>
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {channelOptions.map((channel) => (
                <SelectItem key={channel} value={channel}>
                  {labels.channels[channel]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </CardContent>
    </Card>
  );
}
