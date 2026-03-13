interface OrgChipProps {
  orgId: string;
  size?: "sm" | "md";
}

export function OrgChip({ orgId, size = "sm" }: OrgChipProps) {
  const sizeClass = size === "sm" ? "text-[0.58rem] px-[0.5rem] py-[0.15rem]" : "text-[0.7rem] px-[0.6rem] py-[0.2rem]";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium tracking-wide chip-${orgId.toLowerCase()} ${sizeClass}`}>
      <span className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: `var(--${orgId.toLowerCase()})` }} />
      {orgId.toUpperCase()}
    </span>
  );
}
