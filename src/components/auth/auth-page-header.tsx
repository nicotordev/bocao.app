import Link from "next/link";
import type { ReactNode } from "react";

interface AuthPageHeaderProps {
  title: string;
  description?: ReactNode;
  footer?: {
    help: string;
    href: string;
    label: string;
  };
  centered?: boolean;
}

export function AuthPageHeader({
  title,
  description,
  footer,
  centered = false,
}: AuthPageHeaderProps) {
  return (
    <div className={centered ? "text-center" : undefined}>
      {!centered ? (
        <div className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <span className="text-lg font-bold text-primary">B</span>
        </div>
      ) : null}
      <h2
        className={
          centered
            ? "text-2xl font-bold tracking-tight"
            : "mt-8 text-2xl font-bold tracking-tight"
        }
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      ) : null}
      {footer ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {footer.help}{" "}
          <Link
            href={footer.href}
            className="font-semibold text-primary hover:opacity-80"
          >
            {footer.label}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
