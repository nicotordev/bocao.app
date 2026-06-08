"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FcGoogle } from "react-icons/fc";
import { AuthPageHeader } from "@/components/auth/auth-page-header";
import { AuthShell } from "@/components/auth/auth-shell";
import { OtpCodeInput } from "@/components/auth/otp-code-input";
import { authClient } from "@/lib/auth-client";
import { appRoutes, authRoutes } from "@/lib/auth-routes";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type AuthMode = "sign-in" | "sign-up";
type AuthMethod = "password" | "email";

interface AuthFormProps {
  mode: AuthMode;
}

const AUTH_METHODS = [
  "password",
  "email",
] as const satisfies readonly AuthMethod[];

const RESEND_COOLDOWN_SECONDS = 60;

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const [method, setMethod] = useState<AuthMethod>("password");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const alternateHref =
    mode === "sign-in" ? authRoutes.signUp : authRoutes.signIn;
  const alternateHelp =
    mode === "sign-in" ? t("signInPage.noAccount") : t("signUpPage.hasAccount");
  const alternateLabel =
    mode === "sign-in"
      ? t("signInPage.createAccount")
      : t("signUpPage.signInLink");
  const pageTitle =
    mode === "sign-in" ? t("signInPage.title") : t("signUpPage.title");
  const pageDescription =
    mode === "sign-in"
      ? t("signInPage.description")
      : t("signUpPage.description");
  const pageSubmit =
    mode === "sign-in" ? t("signInPage.submit") : t("signUpPage.submit");
  const sideImage =
    mode === "sign-up"
      ? "/img/auth/pexels-thien-binh-451964862-17264367.webp"
      : "/img/auth/pexels-danielnouri-8253285.webp";
  const isOtpEntryView = method === "email" && emailSent;

  function resetFeedback() {
    setMessage(null);
    setError(null);
  }

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setResendCooldown((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  function startResendCooldown() {
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
  }

  function handleMethodChange(nextMethod: AuthMethod) {
    setMethod(nextMethod);
    setOtp("");
    setEmailSent(false);
    setResendCooldown(0);
    resetFeedback();
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetFeedback();
    setIsSubmitting(true);

    const result =
      mode === "sign-in"
        ? await authClient.signIn.email({
            email,
            password,
            callbackURL: appRoutes.dashboard,
          })
        : await authClient.signUp.email({
            name,
            email,
            password,
            callbackURL: appRoutes.dashboard,
          });

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error.message ?? t("errors.operationFailed"));
      return;
    }

    router.push(appRoutes.dashboard);
  }

  async function sendEmailAccess({
    isResend = false,
  }: { isResend?: boolean } = {}) {
    if (isResend && resendCooldown > 0) {
      return;
    }

    if (isResend) {
      setError(null);
      setIsResending(true);
    } else {
      resetFeedback();
      setIsSubmitting(true);
    }

    const response = await fetch("/api/auth/send-email-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        name: mode === "sign-up" ? name : undefined,
        mode,
      }),
    });

    const data = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (isResend) {
      setIsResending(false);
    } else {
      setIsSubmitting(false);
    }

    if (!response.ok) {
      const errorMessage =
        data?.error ??
        (isResend ? t("errors.resendFailed") : t("errors.sendAccessFailed"));

      if (isResend) {
        toast.error(errorMessage);
      } else {
        setError(errorMessage);
      }
      return;
    }

    startResendCooldown();

    if (isResend) {
      setOtp("");
      toast.success(t("emailOtp.newCodeSent"));
      return;
    }

    setEmailSent(true);
    setMessage(t("emailOtp.sentMessage"));
  }

  async function handleResendCode() {
    await sendEmailAccess({ isResend: true });
  }

  async function handleSendEmailAccess(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    await sendEmailAccess();
  }

  async function handleVerifyEmailOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetFeedback();
    setIsSubmitting(true);

    const result = await authClient.signIn.emailOtp({
      email,
      otp,
      name: mode === "sign-up" ? name : undefined,
      callbackURL: appRoutes.dashboard,
    });

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error.message ?? t("errors.invalidCode"));
      return;
    }

    router.push(appRoutes.dashboard);
  }

  return (
    <AuthShell sideImage={sideImage}>
      {isOtpEntryView ? (
        <AuthPageHeader
          centered
          title={t("emailOtp.title")}
          description={t("emailOtp.description", { email })}
        />
      ) : (
        <AuthPageHeader
          title={pageTitle}
          footer={{
            help: alternateHelp,
            href: alternateHref,
            label: alternateLabel,
          }}
          description={pageDescription}
        />
      )}

      <div className="mt-8 space-y-5">
        {!isOtpEntryView ? (
          <div className="grid grid-cols-2 gap-2">
            {AUTH_METHODS.map((option) => (
              <Button
                variant={method === option ? "default" : "outline"}
                key={option}
                type="button"
                onClick={() => handleMethodChange(option)}
                size="sm"
                className="w-full"
              >
                {t(`methods.${option}`)}
              </Button>
            ))}
          </div>
        ) : null}

        {!isOtpEntryView && message ? (
          <Alert variant="success">
            <AlertTitle>{tCommon("success")}</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>{tCommon("error")}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {method === "password" ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            {mode === "sign-up" ? (
              <div className="space-y-2">
                <Label htmlFor="name">{t("name")}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={t("placeholders.name")}
                  required
                />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email">{tCommon("email")}</Label>
              <Input
                id="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("placeholders.email")}
                type="email"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t("placeholders.password")}
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
              />
            </div>

            {mode === "sign-in" ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) =>
                      setRememberMe(checked === true)
                    }
                  />
                  <Label htmlFor="remember-me" className="text-sm font-normal">
                    {t("signInPage.rememberMe")}
                  </Label>
                </div>
                <Link
                  href={authRoutes.forgotPassword}
                  className="text-sm font-medium text-primary hover:opacity-80"
                >
                  {t("signInPage.forgotPassword")}
                </Link>
              </div>
            ) : null}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? tCommon("processing") : pageSubmit}
            </Button>
          </form>
        ) : null}

        {isOtpEntryView ? (
          <form onSubmit={handleVerifyEmailOtp} className="space-y-6">
            <OtpCodeInput
              id="email-auth-code"
              value={otp}
              onChange={setOtp}
              disabled={isSubmitting}
              autoFocus
            />

            <div className="space-y-3">
              <Button
                type="submit"
                disabled={isSubmitting || otp.length !== 6}
                className="w-full"
              >
                {isSubmitting ? tCommon("confirming") : tCommon("confirm")}
              </Button>
              <Button
                variant="outline"
                type="button"
                disabled={isSubmitting || isResending || resendCooldown > 0}
                onClick={() => {
                  void handleResendCode();
                }}
                className="w-full"
              >
                {isResending
                  ? tCommon("resending")
                  : resendCooldown > 0
                    ? t("emailOtp.resendCodeCooldown", {
                        seconds: resendCooldown,
                      })
                    : t("emailOtp.resendCode")}
              </Button>
            </div>
          </form>
        ) : null}

        {method === "email" && !emailSent ? (
          <form onSubmit={handleSendEmailAccess} className="space-y-5">
            {mode === "sign-up" ? (
              <div className="space-y-2">
                <Label htmlFor="email-auth-name">{t("name")}</Label>
                <Input
                  id="email-auth-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={t("placeholders.name")}
                  required
                />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email-auth-email">{tCommon("email")}</Label>
              <Input
                id="email-auth-email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("placeholders.email")}
                type="email"
                autoComplete="email"
                required
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? tCommon("sending") : t("emailOtp.sendAccess")}
            </Button>
          </form>
        ) : null}

        {!isOtpEntryView ? (
          <div className="space-y-4 pt-2">
            <div className="relative">
              <Separator />
              <span className="bg-background text-muted-foreground absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-3 text-xs font-medium">
                {t("orContinueWith")}
              </span>
            </div>
            <Button variant="outline" type="button" className="w-full gap-3">
              <FcGoogle className="size-5 shrink-0" aria-hidden />
              {t("google")}
            </Button>
          </div>
        ) : null}
      </div>
    </AuthShell>
  );
}
