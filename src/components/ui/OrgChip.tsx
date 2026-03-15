interface OrgChipProps {
  orgId: string;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Unified org badge component. Replaces both OrgChip and OrgBadge.
 * Uses the chip-{org} CSS classes defined in globals.css.
 */
export function OrgChip({ orgId, size = "sm", className = "" }: OrgChipProps) {
  const sizeClass =
    size === "sm"
      ? "text-[0.58rem] px-[0.5rem] py-[0.15rem]"
      : "text-[0.7rem] px-[0.6rem] py-[0.2rem]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium tracking-wide chip-${orgId.toLowerCase()} ${sizeClass} ${className}`}
    >
      <span
        className="w-[5px] h-[5px] rounded-full"
        style={{ backgroundColor: `var(--${orgId.toLowerCase()})` }}
      />
      {orgId.toUpperCase()}
    </span>
  );
}

/** @deprecated Use OrgChip instead. This alias exists for migration only. */
export const OrgBadge = OrgChip;
