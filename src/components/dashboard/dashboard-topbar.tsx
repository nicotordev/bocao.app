"use client";

import { IconBell, IconSearch } from "@tabler/icons-react";
import type { DashboardContext } from "@/lib/dashboard/types";
import { UserMenu } from "@/components/dashboard/user-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

type DashboardTopbarProps = Pick<
  DashboardContext,
  "user" | "membership" | "activeRestaurant"
>;

export function DashboardTopbar({
  user,
  membership,
  activeRestaurant,
}: DashboardTopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-md md:px-6">
      <SidebarTrigger className="-ml-1 md:hidden" />
      <Separator orientation="vertical" className="mr-1 h-6 md:hidden" />

      <div className="hidden min-w-0 flex-1 md:block">
        <p className="truncate text-sm text-muted-foreground">
          {activeRestaurant?.name ?? "Sin local activo"}
        </p>
        <h1 className="truncate font-heading text-base font-semibold">
          Panel de control
        </h1>
      </div>

      <div className="relative ml-auto w-full max-w-sm md:ml-0">
        <IconSearch
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          placeholder="Buscar pedidos, clientes, reservas..."
          className="h-9 bg-muted/30 pl-9"
          aria-label="Buscar en el dashboard"
        />
      </div>

      <Button
        variant="ghost"
        size="icon-sm"
        className="relative shrink-0"
        aria-label="Notificaciones"
      >
        <IconBell className="size-4" aria-hidden />
        <Badge className="absolute -top-1 -right-1 size-4 justify-center rounded-full p-0 text-[10px]">
          3
        </Badge>
      </Button>

      <UserMenu user={user} roleName={membership.roleName} />
    </header>
  );
}
