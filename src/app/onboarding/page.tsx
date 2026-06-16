import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { requireDashboardSession } from "@/lib/dashboard/context";
import { prisma } from "@/lib/prisma";
import { userNeedsProfileName } from "@/lib/user-profile";

export default async function OnboardingPage() {
  const session = await requireDashboardSession();

  if (!session) {
    return null;
  }

  const userRecord = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  });
  const rawUserName = userRecord?.name ?? session.user.name;
  const needsProfileName = userNeedsProfileName(
    rawUserName,
    session.user.email,
  );

  return (
    <OnboardingWizard
      user={{
        id: session.user.id,
        name: rawUserName?.trim() ?? "",
        email: session.user.email,
        image: session.user.image ?? null,
        needsProfileName,
      }}
    />
  );
}
