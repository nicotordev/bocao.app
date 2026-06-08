"use client";

import Link from "next/link";
import { AuthPageHeader } from "@/components/auth/auth-page-header";
import { AuthShell } from "@/components/auth/auth-shell";
import { authRoutes } from "@/lib/auth-routes";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const sideImage = "/img/auth/pexels-danielnouri-8253285.webp";

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_TOKEN: "El link de acceso no es válido o ya fue usado.",
  failed_to_create_user: "No se pudo crear la cuenta.",
  new_user_signup_disabled: "El registro con este método no está disponible.",
};

interface AuthErrorProps {
  errorCode?: string;
}

export function AuthError({ errorCode }: AuthErrorProps) {
  const message =
    (errorCode && ERROR_MESSAGES[errorCode]) ||
    "Ocurrió un problema al completar la autenticación.";

  return (
    <AuthShell sideImage={sideImage}>
      <AuthPageHeader
        title="No pudimos completar el acceso"
        description="Revisa el mensaje e intenta nuevamente."
      />

      <div className="mt-8 space-y-5">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>

        <Button asChild className="w-full">
          <Link href={authRoutes.signIn}>Volver a ingresar</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
