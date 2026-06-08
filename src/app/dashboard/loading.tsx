import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 animate-pulse">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32 rounded-lg" />
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-64 rounded-lg" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-border/60">
            <CardHeader className="pb-2 space-y-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-7 w-16 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-5 w-12 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card className="border-border/60">
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="size-8 rounded-xl" />
                <div className="space-y-1">
                  <Skeleton className="h-5 w-24 rounded" />
                  <Skeleton className="h-4 w-40 rounded" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-[280px] flex flex-col gap-3">
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
            </CardContent>
          </Card>
        </div>
        <Card className="border-border/60">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="size-8 rounded-xl" />
              <div className="space-y-1">
                <Skeleton className="h-5 w-24 rounded" />
                <Skeleton className="h-4 w-40 rounded" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
            </div>
            <Skeleton className="h-4 w-32 rounded" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
