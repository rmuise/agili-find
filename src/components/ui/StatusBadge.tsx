'use client';

import type { TrialStatus } from '@/lib/types';
import { STATUS_LABELS } from '@/lib/types';

interface StatusBadgeProps {
  status: TrialStatus;
  spotsRemaining?: number;
}

export function StatusBadge({ status, spotsRemaining }: StatusBadgeProps) {
  const label =
    status === 'low' && spotsRemaining
      ? `${spotsRemaining} spots left`
      : STATUS_LABELS[status];

  return (
    <span className={`status-${status} text-[0.68rem] font-medium px-[0.6rem] py-[0.25rem] rounded-full whitespace-nowrap`}>
      {label}
    </span>
  );
}
