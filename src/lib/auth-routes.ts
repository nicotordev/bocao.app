export const authRoutes = {
  signIn: "/auth/sign-in",
  signUp: "/auth/sign-up",
  forgotPassword: "/auth/forgot-password",
  resetPassword: "/auth/reset-password",
  verifyEmail: "/auth/verify-email",
  error: "/auth/error",
} as const;

export const appRoutes = {
  dashboard: "/dashboard",
  onboarding: "/onboarding",
} as const;

const legacyAuthPaths = ["/sign-in", "/sign-up", "/login"] as const;

export function isAuthRoute(pathname: string): boolean {
  if (pathname.startsWith("/auth/")) {
    return true;
  }

  return legacyAuthPaths.some((path) => pathname === path);
}

export function isDashboardRoute(pathname: string): boolean {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

export function isOnboardingRoute(pathname: string): boolean {
  return pathname === "/onboarding" || pathname.startsWith("/onboarding/");
}
