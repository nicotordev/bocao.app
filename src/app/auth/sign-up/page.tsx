import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import {
  getDashboardContext,
  requireDashboardSession,
} from "@/lib/dashboard/context";
import { appRoutes } from "@/lib/auth-routes";

export default async function SignUpPage() {
  const session = await requireDashboardSession();

  if (session) {
    const context = await getDashboardContext();
    redirect(context ? appRoutes.dashboard : appRoutes.onboarding);
  }

  return <AuthForm mode="sign-up" />;
}
