"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <main className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 w-full">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border shadow-sm h-44 p-4 bg-card border-border">
            <div className="flex items-start justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-9 rounded-xl" />
            </div>
            <Skeleton className="mt-4 h-8 w-32" />
            <Skeleton className="mt-3 h-5 w-40 rounded-full" />
          </div>
        ))}
      </section>

      <div className="w-full flex flex-col xl:flex-row gap-4 min-w-0">
        <div className="rounded-2xl border shadow-sm p-4 md:p-6 bg-card border-border flex-1">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="mt-4 h-[260px] w-full" />
        </div>
        <div className="rounded-2xl border shadow-sm p-4 md:p-6 bg-card border-border flex-1">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="mt-4 h-[260px] w-full" />
        </div>
      </div>

      <div className="w-full flex flex-col xl:flex-row gap-4 min-w-0">
        <div className="rounded-2xl border shadow-sm p-4 md:p-6 bg-card border-border flex-1">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="mt-4 h-[220px] w-full" />
        </div>
        <div className="rounded-2xl border shadow-sm p-4 md:p-6 bg-card border-border flex-1">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="mt-4 h-[220px] w-full" />
        </div>
      </div>

      <div className="rounded-2xl border shadow-sm p-4 md:p-6 bg-card border-border">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="mt-4 h-[260px] w-full" />
      </div>
    </main>
  );
}

