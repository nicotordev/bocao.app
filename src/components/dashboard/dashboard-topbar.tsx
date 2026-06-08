"use client";

import { TbBell, TbSearch } from "react-icons/tb";
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
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border/40 bg-background/80 px-4 backdrop-blur-md md:px-6">
      <SidebarTrigger className="-ml-1 md:hidden text-muted-foreground hover:text-foreground" />
      <Separator orientation="vertical" className="mr-1 h-6 md:hidden opacity-50" />

      <div className="hidden min-w-0 flex-1 md:block">
        <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/85">
          {activeRestaurant?.name ?? "Sin local activo"}
        </p>
        <h1 className="truncate font-heading text-sm font-semibold text-foreground">
          Panel de control
        </h1>
      </div>

      <div className="relative ml-auto w-full max-w-sm md:ml-0 group">
        <TbSearch
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/80 transition-colors group-focus-within:text-primary"
          aria-hidden
        />
        <Input
          type="search"
          placeholder="Buscar pedidos, clientes, reservas..."
          className="h-9.5 rounded-xl border-border/50 bg-muted/20 pl-9.5 pr-4 text-sm transition-all placeholder:text-muted-foreground/75 focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/40"
          aria-label="Buscar en el dashboard"
        />
      </div>

      <Button
        variant="ghost"
        size="icon-sm"
        className="relative shrink-0 rounded-xl hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105 active:scale-95"
        aria-label="Notificaciones"
      >
        <TbBell className="size-4.5" aria-hidden />
        <Badge className="absolute -top-0.5 -right-0.5 size-4 justify-center rounded-full p-0 text-[9px] font-bold bg-primary text-primary-foreground shadow-sm">
          3
        </Badge>
      </Button>

      <UserMenu user={user} roleName={membership.roleName} />
    </header>
  );
}

