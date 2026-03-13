'use client';

import type { OrgId } from '@/lib/types';

interface OrgChipProps {
  org: OrgId;
  size?: 'sm' | 'md';
}

export function OrgChip({ org, size = 'sm' }: OrgChipProps) {
  const sizeClass = size === 'md'
    ? 'text-[0.7rem] px-[0.65rem] py-[0.22rem]'
    : 'text-[0.58rem] px-[0.55rem] py-[0.18rem]';

  return (
    <span
      className={`chip-${org.toLowerCase()} ${sizeClass} font-medium tracking-[0.09em] uppercase rounded-[7px] border inline-flex items-center gap-[0.35rem] whitespace-nowrap`}
    >
      <span
        className="w-[6px] h-[6px] rounded-full inline-block"
        style={{ background: `var(--${org.toLowerCase()})` }}
      />
      {org}
    </span>
  );
}
