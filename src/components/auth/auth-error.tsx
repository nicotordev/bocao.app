"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { AuthPageHeader } from "@/components/auth/auth-page-header";
import { AuthShell } from "@/components/auth/auth-shell";
import { authRoutes } from "@/lib/auth-routes";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const sideImage = "/img/auth/pexels-danielnouri-8253285.webp";

const KNOWN_ERROR_CODES = [
  "INVALID_TOKEN",
  "failed_to_create_user",
  "new_user_signup_disabled",
] as const;

type KnownErrorCode = (typeof KNOWN_ERROR_CODES)[number];

function isKnownErrorCode(code: string): code is KnownErrorCode {
  return KNOWN_ERROR_CODES.includes(code as KnownErrorCode);
}

interface AuthErrorProps {
  errorCode?: string;
}

export function AuthError({ errorCode }: AuthErrorProps) {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");

  const message =
    errorCode && isKnownErrorCode(errorCode)
      ? t(`errors.${errorCode}`)
      : t("errors.generic");

  return (
    <AuthShell sideImage={sideImage}>
      <AuthPageHeader
        title={t("errorPage.title")}
        description={t("errorPage.description")}
      />

      <div className="mt-8 space-y-5">
        <Alert variant="destructive">
          <AlertTitle>{tCommon("error")}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>

        <Button asChild className="w-full">
          <Link href={authRoutes.signIn}>{t("backToSignIn")}</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
