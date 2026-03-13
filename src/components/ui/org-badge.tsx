interface OrgBadgeProps {
  orgId: string;
  className?: string;
}

export function OrgBadge({ orgId, className = "" }: OrgBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium tracking-wide chip-${orgId.toLowerCase()} ${className}`}
    >
      <span className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: `var(--${orgId.toLowerCase()})` }} />
      {orgId.toUpperCase()}
    </span>
  );
}
