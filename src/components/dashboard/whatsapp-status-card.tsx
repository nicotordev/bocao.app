import { TbBrandWhatsapp, TbMessageCircle } from "react-icons/tb";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type WhatsappStatusCardProps = {
  connected: boolean;
  unreadCount: number;
  lastMessageAt: string;
  responseRate: string;
};

export async function WhatsappStatusCard({
  connected,
  unreadCount,
  lastMessageAt,
  responseRate,
}: WhatsappStatusCardProps) {
  const t = await getTranslations("dashboard.home.whatsapp");

  return (
    <Card className="border-border/60 bg-gradient-to-br from-card to-emerald-500/5">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <TbBrandWhatsapp className="size-4" aria-hidden />
            </span>
            <div>
              <CardTitle>{t("title")}</CardTitle>
              <CardDescription>{t("description")}</CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className={
              connected
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            }
          >
            {connected ? t("connected") : t("disconnected")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border/50 bg-background/40 p-3">
            <p className="text-xs text-muted-foreground">{t("unread")}</p>
            <p className="text-xl font-semibold">{unreadCount}</p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-background/40 p-3">
            <p className="text-xs text-muted-foreground">{t("responseRate")}</p>
            <p className="text-xl font-semibold">{responseRate}</p>
          </div>
        </div>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <TbMessageCircle className="size-4" aria-hidden />
          {t("lastMessage", { time: lastMessageAt })}
        </p>
      </CardContent>
    </Card>
  );
}
