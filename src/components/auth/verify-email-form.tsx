"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
const sideImage = "/img/auth/pexels-thien-binh-451964862-17264367.webp";

interface VerifyEmailFormProps {
  initialEmail?: string;
}

export function VerifyEmailForm({ initialEmail = "" }: VerifyEmailFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setResendCooldown((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  async function sendVerificationCode() {
    if (!email || resendCooldown > 0) {
      return;
    }

    setError(null);
    setIsResending(true);

    const result = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "email-verification",
    });

    setIsResending(false);

    if (result.error) {
      toast.error(result.error.message ?? "No se pudo enviar el código");
      return;
    }

    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    toast.success("Te enviamos un código de verificación");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await authClient.emailOtp.verifyEmail({ email, otp });

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error.message ?? "Código inválido o expirado");
      return;
    }

    toast.success("Email verificado correctamente");
    router.push(appRoutes.dashboard);
  }

  return (
    <AuthShell sideImage={sideImage}>
      <AuthPageHeader
        title="Verifica tu email"
        description="Ingresa el código de 6 dígitos que enviamos a tu correo."
        footer={{
          help: "¿Ya verificaste tu cuenta?",
          href: authRoutes.signIn,
          label: "Ingresar",
        }}
      />

      <div className="mt-8 space-y-5">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="verify-email-address">Email</Label>
            <Input
              id="verify-email-address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@empresa.com"
              type="email"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="verify-email-code">Código</Label>
            <OtpCodeInput
              id="verify-email-code"
              value={otp}
              onChange={setOtp}
              disabled={isSubmitting}
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || otp.length !== 6}
            className="w-full"
          >
            {isSubmitting ? "Verificando..." : "Verificar email"}
          </Button>

          <Button
            variant="outline"
            type="button"
            disabled={isSubmitting || isResending || resendCooldown > 0 || !email}
            onClick={() => {
              void sendVerificationCode();
            }}
            className="w-full"
          >
            {isResending
              ? "Enviando..."
              : resendCooldown > 0
                ? `Reenviar código (${resendCooldown}s)`
                : "Enviar código"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          <Link
            href={authRoutes.signIn}
            className="font-medium text-primary hover:opacity-80"
          >
            Volver a ingresar
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
