import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  getDashboardContext,
  requireDashboardSession,
} from "@/lib/dashboard/context";
import { appRoutes, authRoutes } from "@/lib/auth-routes";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireDashboardSession();

  if (!session) {
    redirect(authRoutes.signIn);
  }

  const context = await getDashboardContext();

  if (!context) {
    redirect(appRoutes.onboarding);
  }

  return <DashboardShell context={context}>{children}</DashboardShell>;
}
