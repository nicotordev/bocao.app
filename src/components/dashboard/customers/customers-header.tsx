import { Download, Megaphone, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { CustomersLabels } from "./types";

type CustomersHeaderProps = {
  labels: CustomersLabels;
  onExport?: () => void;
  onNewCustomer?: () => void;
  onImportCustomers?: () => void;
};

export function CustomersHeader({
  labels,
  onExport,
  onNewCustomer,
  onImportCustomers,
}: CustomersHeaderProps) {
  const showComingSoon = () => {
    toast.message(labels.actions.comingSoon);
  };

  return (
    <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-2xl">
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          {labels.header.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          {labels.header.subtitle}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 xl:grid-cols-4">
        <Button className="gap-2" onClick={onNewCustomer ?? showComingSoon}>
          <Plus className="size-4" aria-hidden />
          {labels.actions.newCustomer}
        </Button>
        <Button
          variant="secondary"
          className="gap-2"
          onClick={onImportCustomers ?? showComingSoon}
        >
          <Upload className="size-4" aria-hidden />
          {labels.importCustomers.button}
        </Button>
        <Button variant="outline" className="gap-2" onClick={onExport}>
          <Download className="size-4" aria-hidden />
          {labels.actions.export}
        </Button>
        <Button variant="outline" className="gap-2" onClick={showComingSoon}>
          <Megaphone className="size-4" aria-hidden />
          {labels.actions.createCampaign}
        </Button>
      </div>
    </section>
  );
}
