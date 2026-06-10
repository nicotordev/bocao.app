import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { OrganizationsOverviewPageClient } from "@/components/dashboard/organizations-overview-page-client";
import { getDashboardContext } from "@/lib/dashboard/context";
import { getOrganizationsOverview } from "@/lib/dashboard/organizations-overview";

export async function generateMetadata() {
  const t = await getTranslations("dashboard.organizations");

  return {
    title: t("title"),
  };
}

export default async function OrganizationsOverviewPage() {
  const context = await getDashboardContext();

  if (!context) {
    redirect("/auth/sign-in");
  }

  const data = await getOrganizationsOverview(context.user.id);

  return <OrganizationsOverviewPageClient data={data} />;
}
