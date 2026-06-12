import Link from "next/link";
import { TbArrowRight, TbUsers } from "react-icons/tb";
import { getTranslations } from "next-intl/server";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardTeamMember } from "@/lib/dashboard/data";
import { cn } from "@/lib/utils";

type TeamActivityCardProps = {
  members: DashboardTeamMember[];
};

const statusDotStyles: Record<DashboardTeamMember["status"], string> = {
  online: "bg-emerald-400",
  busy: "bg-primary",
  offline: "bg-muted-foreground/50",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export async function TeamActivityCard({ members }: TeamActivityCardProps) {
  const t = await getTranslations("dashboard.home.teamActivity");

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/team">
              {t("viewAll")}
              <TbArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <Empty className="border border-dashed border-border/70 bg-muted/10 py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <TbUsers aria-hidden />
              </EmptyMedia>
              <EmptyTitle>{t("empty.title")}</EmptyTitle>
              <EmptyDescription className="max-w-sm">
                {t("empty.description")}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/dashboard/team">{t("empty.cta")}</Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <ul className="space-y-3">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/50 bg-muted/20 px-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar size="sm">
                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {member.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {member.role}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="gap-1.5">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      statusDotStyles[member.status],
                    )}
                    aria-hidden
                  />
                  {t(`status.${member.status}`)}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
