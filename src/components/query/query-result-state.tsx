"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
type QueryResultStateProps<TData> = {
  query: UseQueryResult<TData, Error>;
  isEmpty?: (data: TData) => boolean;
  loadingFallback?: ReactNode;
  emptyFallback?: ReactNode;
  children: (data: TData) => ReactNode;
};

export function QueryLoadingState({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full rounded-2xl" />
      ))}
    </div>
  );
}

export function QueryErrorState({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("query");

  return (
    <Alert variant="destructive">
      <AlertTitle>{t("errorTitle")}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <span>{t("errorDescription")}</span>
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          {t("retry")}
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export function QueryResultState<TData>({
  query,
  isEmpty,
  loadingFallback,
  emptyFallback,
  children,
}: QueryResultStateProps<TData>) {
  if (query.isPending) {
    return <>{loadingFallback ?? <QueryLoadingState />}</>;
  }

  if (query.isError) {
    return (
      <QueryErrorState
        onRetry={() => {
          void query.refetch();
        }}
      />
    );
  }

  if (query.data === undefined) {
    return <>{loadingFallback ?? <QueryLoadingState />}</>;
  }

  if (isEmpty?.(query.data)) {
    return <>{emptyFallback ?? null}</>;
  }

  return <>{children(query.data)}</>;
}
