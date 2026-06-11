import { getTranslations } from "next-intl/server";
import { MarketingAiNewPageClient } from "@/components/dashboard/marketing/marketing-ai-new-page-client";
import { getDashboardContext } from "@/lib/dashboard/context";
import { buildMarketingAiLabels } from "@/lib/marketing/build-marketing-ai-labels";
import { listMenuItems } from "@/lib/menu/repository";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { searchParamsToRecord } from "@/lib/list-url";

type MarketingAiNewPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MarketingAiNewPage({
  searchParams,
}: MarketingAiNewPageProps) {
  const t = await getTranslations("dashboard.marketingAi");
  const context = await getDashboardContext();
  const restaurantId = context?.activeRestaurant?.id ?? "";
  const restaurantName = context?.activeRestaurant?.name ?? "";
  const currency = context?.activeRestaurant?.currency ?? "CLP";
  const canRead =
    context?.membership.permissions.includes(PERMISSIONS.MARKETING_READ) ??
    false;
  const canEdit =
    context?.membership.permissions.includes(PERMISSIONS.MARKETING_WRITE) ??
    false;

  const labels = buildMarketingAiLabels(t);
  const resolvedSearchParams = searchParamsToRecord(await searchParams);
  const preset =
    typeof resolvedSearchParams.preset === "string"
      ? resolvedSearchParams.preset
      : undefined;
  const initialMode =
    resolvedSearchParams.mode === "manual" ? ("manual" as const) : undefined;

  if (!canRead) {
    return (
      <main className="flex flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {labels.wizard.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {labels.wizard.subtitle}
          </p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="font-medium">{labels.permissions.deniedTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {labels.permissions.deniedDescription}
          </p>
        </div>
      </main>
    );
  }

  const menuItems =
    restaurantId.length > 0 ? await listMenuItems(restaurantId) : [];

  return (
    <MarketingAiNewPageClient
      labels={labels}
      restaurantId={restaurantId}
      restaurantName={restaurantName}
      currency={currency}
      canEdit={canEdit}
      menuItems={menuItems}
      initialPreset={preset}
      initialMode={initialMode}
    />
  );
}
