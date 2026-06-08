import { redirect } from "next/navigation";
import {
  getDashboardContext,
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

  const context = await getDashboardContext();

  if (context) {
    redirect(appRoutes.dashboard);
  }

  return children;
}
