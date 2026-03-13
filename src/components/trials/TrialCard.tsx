'use client';

import Link from 'next/link';
import type { Trial } from '@/lib/types';
import { OrgChip } from '@/components/ui/OrgChip';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SaveButton } from '@/components/ui/SaveButton';
import { formatDateRange } from '@/lib/data';

interface TrialCardProps {
  trial: Trial;
  isSaved?: boolean;
}

export function TrialCard({ trial, isSaved = false }: TrialCardProps) {
  const {
    id, name, org, startDate, endDate, city, province,
    venueName, distanceKm, status, spotsRemaining,
    registrationCloses, levels, featured,
  } = trial;

  const dateStr = formatDateRange(startDate, endDate);

  return (
    <Link
      href={`/trials/${id}`}
      className="block no-underline"
    >
      <article
        className={`
          bg-[var(--surface-2)] border rounded-[14px] p-[1.125rem_1.25rem]
          grid grid-cols-[1fr_auto] gap-[0.75rem_1.5rem]
          cursor-pointer transition-all duration-150
          hover:bg-[rgba(232,255,71,0.025)]
          active:scale-[0.99]
          relative
          ${featured
            ? 'border-[rgba(232,255,71,0.35)]'
            : 'border-[var(--border)] hover:border-[rgba(232,255,71,0.25)]'
          }
        `}
      >
        {/* Closing soon badge */}
        {status === 'low' && (
          <div className="absolute top-0 left-0 bg-[var(--accent)] text-black text-[0.58rem] font-medium tracking-[0.1em] uppercase px-[0.7rem] py-[0.2rem] rounded-tl-[14px] rounded-br-[8px]">
            Closing soon
          </div>
        )}

        {/* LEFT */}
        <div className={`min-w-0 ${status === 'low' ? 'pt-5' : 'pt-0'}`}>
          <div className="flex items-start gap-[0.6rem] mb-[0.35rem] flex-wrap">
            <h3 className="text-[0.95rem] font-medium text-cream leading-snug">
              {name}
            </h3>
            <OrgChip org={org} />
          </div>

          <div className="flex items-center gap-2 text-[0.78rem] text-[var(--muted)] flex-wrap mb-[0.5rem]">
            <span>{dateStr}</span>
            <Dot />
            <span>{city}, {province}</span>
            <Dot />
            <span>{venueName}</span>
          </div>

          {/* Level tags */}
          <div className="flex gap-[0.4rem] flex-wrap">
            {levels.slice(0, 4).map((level) => (
              <span
                key={level}
                className="text-[0.67rem] text-[var(--muted)] bg-[var(--surface-3)] px-[0.6rem] py-[0.18rem] rounded-[5px] border border-[var(--border)]"
              >
                {level}
              </span>
            ))}
            {levels.length > 4 && (
              <span className="text-[0.67rem] text-[var(--muted)]">+{levels.length - 4} more</span>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col items-end justify-between gap-[0.75rem] shrink-0 min-w-[100px]">
          {distanceKm !== undefined && (
            <div className="text-[0.78rem] text-[var(--muted)] text-right whitespace-nowrap">
              <strong className="text-cream text-[1rem] font-medium block">
                {distanceKm} km
              </strong>
              away
            </div>
          )}
          <StatusBadge status={status} spotsRemaining={spotsRemaining} />
          <SaveButton trialId={id} initialSaved={isSaved} />
        </div>
      </article>
    </Link>
  );
}

function Dot() {
  return (
    <span className="w-[2.5px] h-[2.5px] rounded-full bg-[var(--muted-2)] shrink-0 inline-block" />
  );
}
