import { redirect } from "next/navigation";
import {
  hasUserMembership,
  requireDashboardSession,
} from "@/lib/dashboard/context";
import { appRoutes, authRoutes } from "@/lib/auth-routes";

export default async function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireDashboardSession();

  if (!session) {
    redirect(authRoutes.signIn);
  }

  const completed = await hasUserMembership(session.user.id);

  if (completed) {
    redirect(appRoutes.dashboard);
  }

  return children;
}
