import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import {
  authRoutes,
  isDashboardRoute,
  isOnboardingRoute,
} from "@/lib/auth-routes";

export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  if (isDashboardRoute(pathname) && !sessionCookie) {
    return NextResponse.redirect(new URL(authRoutes.signIn, request.url));
  }

  if (isOnboardingRoute(pathname) && !sessionCookie) {
    return NextResponse.redirect(new URL(authRoutes.signIn, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding",
    "/onboarding/:path*",
    "/auth/:path*",
    "/sign-in",
    "/sign-up",
    "/login",
  ],
};
