import { Skeleton } from "@/components/ui/skeleton";

function MenuTreeItemRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-background px-3 py-2.5">
      <Skeleton className="size-6 shrink-0 rounded-lg" />
      <Skeleton className="size-10 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-4 w-2/5 max-w-48" />
        <Skeleton className="h-3 w-3/5 max-w-64" />
        <div className="flex gap-1.5 pt-0.5">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-4 w-12 shrink-0" />
      <div className="flex shrink-0 gap-1">
        <Skeleton className="size-7 rounded-md" />
        <Skeleton className="size-7 rounded-md" />
      </div>
    </div>
  );
}

function MenuTreeCategorySectionSkeleton({ itemCount }: { itemCount: number }) {
  return (
    <section className="rounded-3xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-3 py-3">
        <Skeleton className="size-6 shrink-0 rounded-lg" />
        <Skeleton className="size-4 shrink-0 rounded" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="size-7 shrink-0 rounded-md" />
      </div>
      <div className="space-y-2 p-3 pl-5 md:pl-8">
        {Array.from({ length: itemCount }, (_, index) => (
          <MenuTreeItemRowSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}

export function MenuTreeBoardSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      <Skeleton className="h-12 w-full rounded-3xl" />
      <MenuTreeCategorySectionSkeleton itemCount={3} />
      <MenuTreeCategorySectionSkeleton itemCount={2} />
    </div>
  );
}
