import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

type DashboardSectionEmptyProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  cta?: {
    label: string;
    href: string;
  };
};

export function DashboardSectionEmpty({
  icon,
  title,
  description,
  cta,
}: DashboardSectionEmptyProps) {
  return (
    <Empty className="border border-dashed border-border/70 bg-muted/10 py-10">
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription className="max-w-sm">{description}</EmptyDescription>
      </EmptyHeader>
      {cta ? (
        <EmptyContent>
          <Button asChild>
            <Link href={cta.href}>{cta.label}</Link>
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}
