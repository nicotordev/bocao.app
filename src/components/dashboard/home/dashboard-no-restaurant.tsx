import Link from "next/link";
import { TbBuildingStore } from "react-icons/tb";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export async function DashboardNoRestaurant() {
  const t = await getTranslations("dashboard.home.noRestaurant");

  return (
    <Empty className="min-h-[50vh] border border-dashed border-border/70 bg-card/50">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <TbBuildingStore aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{t("title")}</EmptyTitle>
        <EmptyDescription className="max-w-md">
          {t("description")}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href="/dashboard/organizations">{t("ctaOrganizations")}</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/onboarding">{t("ctaOnboarding")}</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
