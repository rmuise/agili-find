export function TrialCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-5 w-12 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-48" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3.5 bg-gray-100 rounded w-40" />
            <div className="h-3.5 bg-gray-100 rounded w-56" />
            <div className="h-3.5 bg-gray-100 rounded w-32" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 bg-gray-100 rounded" />
          <div className="h-8 w-8 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}

export function ResultsListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <TrialCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ScheduleCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
      <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 text-center animate-pulse">
      <div className="h-8 w-12 bg-gray-200 rounded mx-auto mb-2" />
      <div className="h-3 w-20 bg-gray-100 rounded mx-auto" />
    </div>
  );
}
