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
const sideImage = "/img/auth/pexels-danielnouri-8253285.webp";

interface ResetPasswordFormProps {
  initialEmail?: string;
}

export function ResetPasswordForm({ initialEmail = "" }: ResetPasswordFormProps) {
  const router = useRouter();
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
      toast.error(result.error.message ?? "No se pudo reenviar el código");
      return;
    }

    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    toast.success("Te enviamos un nuevo código");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
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
      setError(result.error.message ?? "No se pudo restablecer la contraseña");
      return;
    }

    toast.success("Contraseña actualizada correctamente");
    router.push(authRoutes.signIn);
  }

  return (
    <AuthShell sideImage={sideImage}>
      <AuthPageHeader
        title="Restablecer contraseña"
        description={
          email
            ? `Ingresa el código enviado a ${email} y tu nueva contraseña.`
            : "Ingresa tu email, el código y tu nueva contraseña."
        }
        footer={{
          help: "¿Ya tienes cuenta?",
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
            <Label htmlFor="reset-password-email">Email</Label>
            <Input
              id="reset-password-email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@empresa.com"
              type="email"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reset-password-code">Código</Label>
            <OtpCodeInput
              id="reset-password-code"
              value={otp}
              onChange={setOtp}
              disabled={isSubmitting}
              autoFocus={Boolean(initialEmail)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reset-password-new">Nueva contraseña</Label>
            <Input
              id="reset-password-new"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reset-password-confirm">Confirmar contraseña</Label>
            <Input
              id="reset-password-confirm"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="••••••••"
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
            {isSubmitting ? "Guardando..." : "Restablecer contraseña"}
          </Button>

          <Button
            variant="outline"
            type="button"
            disabled={isSubmitting || isResending || resendCooldown > 0 || !email}
            onClick={() => {
              void requestResetCode();
            }}
            className="w-full"
          >
            {isResending
              ? "Reenviando..."
              : resendCooldown > 0
                ? `Reenviar código (${resendCooldown}s)`
                : "Reenviar código"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          <Link
            href={appRoutes.dashboard}
            className="font-medium text-primary hover:opacity-80"
          >
            Ir al inicio
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
