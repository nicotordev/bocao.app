import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type FloorPlanPageSkeletonProps = {
  embedded?: boolean;
};

function FloorPlanToolbarSkeleton() {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <Skeleton className="size-8 rounded-md" />
      <Skeleton className="h-8 w-56 rounded-full" />
      <Skeleton className="h-8 w-28 rounded-md" />
      <Skeleton className="h-8 w-24 rounded-md" />
      <Skeleton className="h-8 w-28 rounded-md" />
      <Skeleton className="h-8 w-28 rounded-md" />
      <Skeleton className="h-8 w-8 rounded-md" />
      <div className="ml-auto flex flex-wrap gap-2">
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
    </div>
  );
}

function FloorPlanCanvasSkeleton() {
  return (
    <div className="relative h-full min-h-0 w-full flex-1">
      <Skeleton className="absolute inset-0 h-full w-full rounded-none bg-muted/30" />
      <Skeleton className="absolute left-[22%] top-[28%] size-12 rounded-full" />
      <Skeleton className="absolute left-[48%] top-[34%] size-10 rounded-lg" />
      <Skeleton className="absolute right-[24%] top-[42%] h-10 w-14 rounded-lg" />
      <Skeleton className="absolute bottom-[30%] left-[36%] size-11 rounded-full" />
      <Skeleton className="absolute bottom-[24%] right-[30%] h-9 w-12 rounded-lg" />
    </div>
  );
}

function FloorPlanBuilderPanelSkeleton() {
  return (
    <div className="min-h-0 space-y-4 overflow-hidden border-l border-border pl-3">
      <Skeleton className="h-4 w-36" />

      <div className="space-y-4 rounded-xl border border-border/60 p-4">
        <Skeleton className="h-5 w-32" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        <Skeleton className="h-3 w-44" />
      </div>

      <div className="space-y-4 rounded-xl border border-border/60 p-4">
        <Skeleton className="h-5 w-24" />
        <div className="rounded-3xl border border-dashed border-border bg-muted/20 p-4">
          <Skeleton className="mb-3 h-3 w-32" />
          <Skeleton className="mx-auto size-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full max-w-xs" />
      </div>
    </div>
  );
}

export function FloorPlanPageSkeleton({
  embedded = false,
}: FloorPlanPageSkeletonProps) {
  return (
    <div
      className={cn(
        "flex min-h-0 w-full flex-col gap-3",
        embedded ? "h-full" : "h-full p-3 md:p-4",
      )}
    >
      <FloorPlanToolbarSkeleton />
      <div className="grid min-h-0 w-full flex-1 grid-cols-[minmax(0,1fr)_min(320px,32vw)] gap-3">
        <Card className="flex h-full min-h-0 w-full flex-1 flex-col border-0 shadow-none">
          <CardContent className="flex h-full min-h-0 w-full flex-1 flex-col p-0">
            <FloorPlanCanvasSkeleton />
          </CardContent>
        </Card>
        <FloorPlanBuilderPanelSkeleton />
      </div>
    </div>
  );
}
