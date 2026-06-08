import { redirect } from "next/navigation";
import { authRoutes } from "@/lib/auth-routes";

export default function LegacySignUpPage() {
  redirect(authRoutes.signUp);
}
