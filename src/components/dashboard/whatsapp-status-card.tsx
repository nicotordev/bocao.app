import Link from "next/link";
import { TbArrowRight, TbBrandWhatsapp, TbMessageCircle } from "react-icons/tb";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
  const headerActionLabel = connected ? t("viewAll") : t("connect");

  return (
    <Card className="flex h-full flex-col border-border/60 bg-gradient-to-br from-card to-emerald-500/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <TbBrandWhatsapp className="size-4" aria-hidden />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{t("title")}</CardTitle>
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
            <CardDescription>{t("description")}</CardDescription>
          </div>
        </div>
        <CardAction>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/whatsapp/inbox">
              {headerActionLabel}
              <TbArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex-1 grid gap-4">
        {connected ? (
          <>
            <Link
              href="/dashboard/whatsapp/inbox"
              className="grid grid-cols-2 gap-3 rounded-2xl outline-none transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              <div
                className={cn(
                  "rounded-2xl border border-border/50 bg-background/40 p-3",
                  unreadCount > 0 && "border-emerald-500/30 bg-emerald-500/5",
                )}
              >
                <p className="text-xs text-muted-foreground">{t("unread")}</p>
                <p
                  className={cn(
                    "text-xl font-semibold",
                    unreadCount > 0 && "text-emerald-400",
                  )}
                >
                  {unreadCount}
                </p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/40 p-3">
                <p className="text-xs text-muted-foreground">
                  {t("responseRate")}
                </p>
                <p className="text-xl font-semibold">{responseRate}</p>
              </div>
            </Link>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <TbMessageCircle className="size-4" aria-hidden />
              {t("lastMessage", { time: lastMessageAt })}
            </p>
          </>
        ) : (
          <Empty className="border border-dashed border-border/70 bg-muted/10 py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <TbBrandWhatsapp aria-hidden />
              </EmptyMedia>
              <EmptyTitle>{t("empty.title")}</EmptyTitle>
              <EmptyDescription className="max-w-sm">
                {t("empty.description")}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/dashboard/whatsapp/inbox">{t("empty.cta")}</Link>
              </Button>
            </EmptyContent>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}
