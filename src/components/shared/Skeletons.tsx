import { Skeleton } from '@/components/ui/skeleton';

// ── Dashboard Skeleton ────────────────────────────────────────────────
export function DashboardSkeleton() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="bg-card border border-border rounded-lg p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-3 w-full rounded-full mb-3" />
        <div className="flex gap-5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-16" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4 px-5 py-3.5 border-b border-border last:border-0">
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-3 w-10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Notification List Skeleton ────────────────────────────────────────
export function NotificationListSkeleton() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="flex items-center gap-3 mb-5">
        <Skeleton className="h-9 flex-1 min-w-52" />
        <Skeleton className="h-9 w-72 rounded-lg" />
        <Skeleton className="h-9 w-9" />
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-2.5 border-b border-border bg-secondary/30">
          {['Notification', 'Platforms', 'Target', 'Status', ''].map((h) => (
            <Skeleton key={h} className="h-3 w-16" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3.5 border-b border-border last:border-0 items-center">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-2.5 w-20" />
            </div>
            <div className="flex gap-1">
              <Skeleton className="h-3.5 w-3.5 rounded" />
              <Skeleton className="h-3.5 w-3.5 rounded" />
            </div>
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-7 w-7 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Notification Detail Skeleton ───────────────────────────────────────
export function NotificationDetailSkeleton() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-start gap-3 mb-6">
        <Skeleton className="mt-1 h-8 w-8 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>

      <div className="flex gap-1 mb-5">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-28 rounded-md" />
        <Skeleton className="h-9 w-16 rounded-md" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 col-span-2">
          <Skeleton className="h-4 w-16 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 text-center">
            <Skeleton className="h-2.5 w-16 mx-auto mb-2" />
            <Skeleton className="h-8 w-20 mx-auto mb-1" />
            <Skeleton className="h-3 w-12 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Template List Skeleton ─────────────────────────────────────────────
export function TemplateListSkeleton() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-5 w-9 rounded-full" />
            </div>
            <div className="bg-secondary/50 rounded-md p-3 space-y-1.5">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <div className="flex gap-1">
              <Skeleton className="h-5 w-14 rounded" />
              <Skeleton className="h-5 w-12 rounded" />
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-border">
              <Skeleton className="h-3.5 w-14" />
              <Skeleton className="h-7 w-7 rounded-md ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Segment Estimator Skeleton ─────────────────────────────────────────
export function SegmentEstimatorSkeleton() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="bg-card border border-border rounded-lg p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-8 w-8 rounded-md" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-7 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-secondary/50 rounded-md p-3 space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-2.5 w-24" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-card border border-border rounded-lg p-5 mb-4">
        <Skeleton className="h-4 w-36 mb-1" />
        <Skeleton className="h-3 w-64 mb-4" />
        <div className="grid md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-4 rounded-lg border border-border">
              <Skeleton className="h-8 w-8 rounded-md flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <Skeleton className="h-9 w-44" />
    </div>
  );
}

// ── Device Tokens Skeleton ─────────────────────────────────────────────
export function DeviceTokensSkeleton() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[auto_2fr_1fr_1fr_auto] gap-4 px-5 py-2.5 border-b border-border bg-secondary/30">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-16" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[auto_2fr_1fr_1fr_auto] gap-4 px-5 py-3.5 border-b border-border last:border-0 items-center">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-1.5 w-1.5 rounded-full" />
            </div>
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-7 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
