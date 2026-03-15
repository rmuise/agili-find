'use client';

import { TRIAL_STATUS_LABELS } from '@/lib/constants';
import type { TrialStatus } from '@/lib/constants';

interface StatusBadgeProps {
  status: TrialStatus;
  spotsRemaining?: number;
}

export function StatusBadge({ status, spotsRemaining }: StatusBadgeProps) {
  const label =
    status === 'low' && spotsRemaining
      ? `${spotsRemaining} spots left`
      : TRIAL_STATUS_LABELS[status];

  return (
    <span className={`status-${status} text-[0.68rem] font-medium px-[0.6rem] py-[0.25rem] rounded-full whitespace-nowrap`}>
      {label}
    </span>
  );
}
