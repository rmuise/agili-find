'use client';

import { useState } from 'react';

interface SaveButtonProps {
  trialId: string;
  initialSaved?: boolean;
  className?: string;
}

export function SaveButton({ trialId, initialSaved = false, className = '' }: SaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSaved((prev) => !prev);
    // TODO: persist to user account / localStorage
    console.log(saved ? `Unsaved ${trialId}` : `Saved ${trialId}`);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        flex items-center gap-[0.35rem] text-[0.72rem] font-medium
        px-[0.75rem] py-[0.35rem] rounded-[10px] border transition-all duration-150
        whitespace-nowrap
        ${saved
          ? 'bg-[rgba(232,255,71,0.08)] border-[rgba(232,255,71,0.3)] text-[var(--accent)]'
          : 'bg-transparent border-[var(--border-2)] text-[var(--muted-text)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
        }
        ${className}
      `}
      aria-label={saved ? 'Remove from saved' : 'Save trial'}
    >
      <svg
        width="11"
        height="11"
        viewBox="0 0 12 12"
        fill={saved ? 'currentColor' : 'none'}
        className="flex-shrink-0"
      >
        <path
          d="M6 1l1.5 3h3l-2.5 2 1 3L6 7.5 3 9l1-3L1.5 4h3z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
      {saved ? 'Saved' : 'Save'}
    </button>
  );
}
