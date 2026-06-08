import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { requireDashboardSession } from "@/lib/dashboard/context";

export default async function OnboardingPage() {
  const session = await requireDashboardSession();

  if (!session) {
    return null;
  }

  return (
    <OnboardingWizard
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
      }}
    />
  );
}
