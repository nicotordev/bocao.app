"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { appRoutes, authRoutes } from "@/lib/auth-routes";
import { AuthPageHeader } from "@/components/auth/auth-page-header";
import { AuthShell } from "@/components/auth/auth-shell";
import { OtpCodeInput } from "@/components/auth/otp-code-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const RESEND_COOLDOWN_SECONDS = 60;
const sideImage = "/img/auth/pexels-danielnouri-8253285.webp";

interface ResetPasswordFormProps {
  initialEmail?: string;
}

export function ResetPasswordForm({
  initialEmail = "",
}: ResetPasswordFormProps) {
  const router = useRouter();
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(
    initialEmail ? RESEND_COOLDOWN_SECONDS : 0,
  );

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setResendCooldown((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  async function requestResetCode() {
    if (!email || resendCooldown > 0) {
      return;
    }

    setError(null);
    setIsResending(true);

    const result = await authClient.emailOtp.requestPasswordReset({ email });

    setIsResending(false);

    if (result.error) {
      toast.error(result.error.message ?? t("errors.resendFailed"));
      return;
    }

    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    toast.success(t("resetPassword.newCodeSent"));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("resetPassword.passwordMismatch"));
      return;
    }

    setIsSubmitting(true);

    const result = await authClient.emailOtp.resetPassword({
      email,
      otp,
      password,
    });

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error.message ?? t("resetPassword.resetFailed"));
      return;
    }

    toast.success(t("resetPassword.success"));
    router.push(authRoutes.signIn);
  }

  return (
    <AuthShell sideImage={sideImage}>
      <AuthPageHeader
        title={t("resetPassword.title")}
        description={
          email
            ? t("resetPassword.descriptionWithEmail", { email })
            : t("resetPassword.descriptionWithoutEmail")
        }
        footer={{
          help: t("resetPassword.hasAccount"),
          href: authRoutes.signIn,
          label: t("signIn"),
        }}
      />

      <div className="mt-8 space-y-5">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>{tCommon("error")}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="reset-password-email">{tCommon("email")}</Label>
            <Input
              id="reset-password-email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("placeholders.email")}
              type="email"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reset-password-code">{t("code")}</Label>
            <OtpCodeInput
              id="reset-password-code"
              value={otp}
              onChange={setOtp}
              disabled={isSubmitting}
              autoFocus={Boolean(initialEmail)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reset-password-new">{t("newPassword")}</Label>
            <Input
              id="reset-password-new"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("placeholders.password")}
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reset-password-confirm">
              {t("confirmPassword")}
            </Label>
            <Input
              id="reset-password-confirm"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder={t("placeholders.password")}
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || otp.length !== 6}
            className="w-full"
          >
            {isSubmitting ? tCommon("saving") : t("resetPassword.submit")}
          </Button>

          <Button
            variant="outline"
            type="button"
            disabled={
              isSubmitting || isResending || resendCooldown > 0 || !email
            }
            onClick={() => {
              void requestResetCode();
            }}
            className="w-full"
          >
            {isResending
              ? tCommon("resending")
              : resendCooldown > 0
                ? t("emailOtp.resendCodeCooldown", { seconds: resendCooldown })
                : t("emailOtp.resendCode")}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          <Link
            href={appRoutes.dashboard}
            className="font-medium text-primary hover:opacity-80"
          >
            {t("resetPassword.goHome")}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
