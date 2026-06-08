import { IconBrandWhatsapp, IconMessageCircle } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type WhatsappStatusCardProps = {
  connected: boolean;
  unreadCount: number;
  lastMessageAt: string;
  responseRate: string;
};

export function WhatsappStatusCard({
  connected,
  unreadCount,
  lastMessageAt,
  responseRate,
}: WhatsappStatusCardProps) {
  return (
    <Card className="border-border/60 bg-gradient-to-br from-card to-emerald-500/5">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <IconBrandWhatsapp className="size-4" aria-hidden />
            </span>
            <div>
              <CardTitle>WhatsApp</CardTitle>
              <CardDescription>Canal de atención y pedidos</CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className={
              connected
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            }
          >
            {connected ? "Conectado" : "Desconectado"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border/50 bg-background/40 p-3">
            <p className="text-xs text-muted-foreground">Sin leer</p>
            <p className="text-xl font-semibold">{unreadCount}</p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-background/40 p-3">
            <p className="text-xs text-muted-foreground">Tasa de respuesta</p>
            <p className="text-xl font-semibold">{responseRate}</p>
          </div>
        </div>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <IconMessageCircle className="size-4" aria-hidden />
          Último mensaje {lastMessageAt}
        </p>
      </CardContent>
    </Card>
  );
}
