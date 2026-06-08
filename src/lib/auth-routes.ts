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
} as const;
