import { IconBuildingStore } from "@tabler/icons-react";
import type { DashboardUser } from "@/lib/dashboard/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const onboardingBackgroundImage =
  "/img/auth/pexels-thien-binh-451964862-17264367.webp";

type OnboardingEmptyStateProps = {
  user: DashboardUser;
};

export function OnboardingEmptyState({ user }: OnboardingEmptyStateProps) {
  return (
    <main className="relative flex min-h-svh items-center justify-center p-6">
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${onboardingBackgroundImage}')` }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-background/92 via-background/78 to-primary/25"
      />
      <div aria-hidden className="absolute inset-0 bg-black/35" />

      <Card className="relative z-10 w-full max-w-lg border-border/60 bg-card/95 shadow-2xl ring-1 ring-foreground/10 backdrop-blur-md">
        <CardHeader>
          <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <IconBuildingStore className="size-6" aria-hidden />
          </div>
          <CardTitle>Configura tu restaurante</CardTitle>
          <CardDescription>
            Hola {user.name}, tu cuenta aún no está vinculada a una
            organización. Contacta al administrador o completa el onboarding
            para empezar a operar con Bocao.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button className="flex-1">Crear organización</Button>
          <Button variant="outline" className="flex-1">
            Unirme con invitación
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
