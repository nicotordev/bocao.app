import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TbUsers,
  TbCalendar,
  TbCircleCheck,
  TbAlertCircle,
} from "react-icons/tb";

type ReservationsKpisProps = {
  labels: {
    total: string;
    confirmed: string;
    pending: string;
    guests: string;
  };
  values: {
    total: number;
    confirmed: number;
    pending: number;
    guests: number;
  };
};

export function ReservationsKpis({ labels, values }: ReservationsKpisProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardDescription>{labels.total}</CardDescription>
            <CardTitle className="text-2xl font-semibold tracking-tight">
              {values.total}
            </CardTitle>
          </div>
          <TbCalendar className="size-5 text-muted-foreground" />
        </CardHeader>
      </Card>

      <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardDescription>{labels.confirmed}</CardDescription>
            <CardTitle className="text-2xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-500">
              {values.confirmed}
            </CardTitle>
          </div>
          <TbCircleCheck className="size-5 text-emerald-600 dark:text-emerald-500" />
        </CardHeader>
      </Card>

      <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardDescription>{labels.pending}</CardDescription>
            <CardTitle className="text-2xl font-semibold tracking-tight text-amber-500">
              {values.pending}
            </CardTitle>
          </div>
          <TbAlertCircle className="size-5 text-amber-500" />
        </CardHeader>
      </Card>

      <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardDescription>{labels.guests}</CardDescription>
            <CardTitle className="text-2xl font-semibold tracking-tight text-indigo-600 dark:text-indigo-400">
              {values.guests}
            </CardTitle>
          </div>
          <TbUsers className="size-5 text-indigo-600 dark:text-indigo-400" />
        </CardHeader>
      </Card>
    </section>
  );
}
