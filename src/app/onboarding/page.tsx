import { OnboardingEmptyState } from "@/components/dashboard/onboarding-empty-state";
import { requireDashboardSession } from "@/lib/dashboard/context";

export default async function OnboardingPage() {
  const session = await requireDashboardSession();

  if (!session) {
    return null;
  }

  return (
    <OnboardingEmptyState
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
      }}
    />
  );
}
