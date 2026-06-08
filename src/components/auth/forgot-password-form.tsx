"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { authRoutes } from "@/lib/auth-routes";
import { AuthPageHeader } from "@/components/auth/auth-page-header";
import { AuthShell } from "@/components/auth/auth-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const sideImage = "/img/auth/pexels-danielnouri-8253285.webp";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await authClient.emailOtp.requestPasswordReset({ email });

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error.message ?? "No se pudo enviar el código");
      return;
    }

    toast.success("Te enviamos un código para restablecer tu contraseña");
    router.push(
      `${authRoutes.resetPassword}?email=${encodeURIComponent(email)}`,
    );
  }

  return (
    <AuthShell sideImage={sideImage}>
      <AuthPageHeader
        title="¿Olvidaste tu contraseña?"
        description="Ingresa tu email y te enviaremos un código de 6 dígitos."
        footer={{
          help: "¿Recordaste tu contraseña?",
          href: authRoutes.signIn,
          label: "Volver a ingresar",
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
            <Label htmlFor="forgot-password-email">Email</Label>
            <Input
              id="forgot-password-email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@empresa.com"
              type="email"
              autoComplete="email"
              required
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Enviando..." : "Enviar código"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          <Link
            href={authRoutes.signIn}
            className="font-medium text-primary hover:opacity-80"
          >
            Cancelar
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
