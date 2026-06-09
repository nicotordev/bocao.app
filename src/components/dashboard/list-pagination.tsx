"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { buildListUrl } from "@/lib/list-url";
import type { PaginationMeta } from "@/lib/pagination";
import { cn } from "@/lib/utils";

type ListPaginationLabels = {
  previous: string;
  next: string;
  page: string;
  of: string;
};

type ListPaginationProps = {
  basePath: string;
  params: Record<string, string | number | boolean | undefined | null>;
  meta: PaginationMeta;
  labels: ListPaginationLabels;
  className?: string;
};

function getVisiblePages(current: number, total: number) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, total, current]);

  for (let offset = -1; offset <= 1; offset += 1) {
    const page = current + offset;
    if (page > 1 && page < total) {
      pages.add(page);
    }
  }

  return [...pages].sort((left, right) => left - right);
}

export function ListPagination({
  basePath,
  params,
  meta,
  labels,
  className,
}: ListPaginationProps) {
  if (meta.totalPages <= 1) {
    return null;
  }

  const visiblePages = getVisiblePages(meta.page, meta.totalPages);
  const previousPage = Math.max(1, meta.page - 1);
  const nextPage = Math.min(meta.totalPages, meta.page + 1);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">
        {labels.page} {meta.page} {labels.of} {meta.totalPages}
      </p>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href={buildListUrl(basePath, params, {
                page: previousPage,
                pageSize: meta.pageSize,
              })}
              text={labels.previous}
              aria-disabled={meta.page <= 1}
              className={
                meta.page <= 1 ? "pointer-events-none opacity-50" : undefined
              }
            />
          </PaginationItem>
          {visiblePages.map((page, index) => {
            const previous = visiblePages[index - 1];
            const showEllipsis = previous !== undefined && page - previous > 1;

            return (
              <span key={page} className="contents">
                {showEllipsis ? (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : null}
                <PaginationItem>
                  <PaginationLink
                    href={buildListUrl(basePath, params, {
                      page,
                      pageSize: meta.pageSize,
                    })}
                    isActive={page === meta.page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              </span>
            );
          })}
          <PaginationItem>
            <PaginationNext
              href={buildListUrl(basePath, params, {
                page: nextPage,
                pageSize: meta.pageSize,
              })}
              text={labels.next}
              aria-disabled={meta.page >= meta.totalPages}
              className={
                meta.page >= meta.totalPages
                  ? "pointer-events-none opacity-50"
                  : undefined
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
