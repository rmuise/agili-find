export function AttendingBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
      <span aria-hidden="true">&#127941;</span>
      Attending This Trial
    </span>
  );
}
