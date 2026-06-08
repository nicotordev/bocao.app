import { redirect } from "next/navigation";
import { authRoutes } from "@/lib/auth-routes";

export default function LegacySignInPage() {
  redirect(authRoutes.signIn);
}
