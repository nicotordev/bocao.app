import "dotenv/config";

type CronResult = {
  processed: number;
  generated: number;
  skipped: number;
  errors: Array<{ restaurantId: string; locale: string; error: string }>;
};

function resolveAppUrl(): string | undefined {
  return (
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.BETTER_AUTH_URL
  );
}

async function main() {
  const secret = process.env.CRON_SECRET;
  const baseUrl = resolveAppUrl();

  if (!secret) {
    console.error("[cron/analytics-insights] CRON_SECRET is not configured");
    process.exit(1);
  }

  if (!baseUrl) {
    console.error(
      "[cron/analytics-insights] Set APP_URL, NEXT_PUBLIC_APP_URL, or BETTER_AUTH_URL",
    );
    process.exit(1);
  }

  const url = `${baseUrl.replace(/\/$/, "")}/api/cron/analytics-insights`;
  const response = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${secret}` },
  });

  const body = await response.text();
  let result: CronResult | { error?: string } | null = null;

  try {
    result = JSON.parse(body) as CronResult | { error?: string };
  } catch {
    result = null;
  }

  if (!response.ok) {
    console.error(`[cron/analytics-insights] HTTP ${response.status}: ${body}`);
    process.exit(1);
  }

  if (!result || !("processed" in result)) {
    console.error("[cron/analytics-insights] Unexpected response:", body);
    process.exit(1);
  }

  console.log(
    `[cron/analytics-insights] processed=${result.processed} generated=${result.generated} skipped=${result.skipped} errors=${result.errors.length}`,
  );

  if (result.errors.length > 0) {
    for (const entry of result.errors) {
      console.error(
        `[cron/analytics-insights] ${entry.restaurantId} (${entry.locale}): ${entry.error}`,
      );
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("[cron/analytics-insights] failed", error);
  process.exit(1);
});
