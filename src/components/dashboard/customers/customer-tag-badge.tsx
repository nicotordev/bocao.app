import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CustomerTagSummary } from "@/lib/customers/tags.types";

type CustomerTagBadgeProps = {
  tag: CustomerTagSummary;
  className?: string;
};

function getTagStyle(color: string | null) {
  if (!color) {
    return undefined;
  }

  return {
    backgroundColor: `${color}20`,
    borderColor: `${color}55`,
    color,
  } as const;
}

export function CustomerTagBadge({ tag, className }: CustomerTagBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", className)}
      style={getTagStyle(tag.color)}
    >
      {tag.name}
    </Badge>
  );
}
