import Link from "next/link";
import { TbArrowRight, TbUsers } from "react-icons/tb";
import { getTranslations } from "next-intl/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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
import { resolveUserProfileImage } from "@/lib/user-profile";
import { cn } from "@/lib/utils";

type TeamActivityCardProps = {
  members: DashboardTeamMember[];
};

const statusDotStyles: Record<DashboardTeamMember["status"], string> = {
  online: "bg-emerald-500",
  busy: "bg-primary",
  offline: "bg-muted-foreground/40",
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
    <Card className="border-border/40">
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
          <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex items-center gap-3 rounded-2xl border border-border/40 bg-muted/10 p-3.5 transition-colors hover:bg-muted/20"
              >
                <div className="relative shrink-0">
                  <Avatar size="sm" className="ring-2 ring-background">
                    <AvatarImage
                      src={resolveUserProfileImage(member.image)}
                      alt={member.name}
                    />
                    <AvatarFallback className="bg-primary/5 text-primary font-medium text-xs">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background",
                      statusDotStyles[member.status],
                    )}
                    aria-hidden
                  />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {member.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {member.role}
                  </p>
                  <span className="sr-only">
                    {t(`status.${member.status}`)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
