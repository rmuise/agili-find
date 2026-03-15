"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { OrgBadge } from "@/components/ui/org-badge";
import type { JudgeSearchResult } from "@/types/judge";

interface JudgeProfileCardProps {
  judge: JudgeSearchResult;
}

export function JudgeProfileCard({ judge }: JudgeProfileCardProps) {
  const initials = judge.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link
      href={`/judges/${judge.slug}`}
      className="block mb-4 bg-[var(--surface)] border border-[var(--agili-accent)]/20 rounded-[14px] p-4 hover:border-[var(--agili-accent)]/40 transition-colors group"
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-[rgba(232,255,71,0.08)] border border-[rgba(232,255,71,0.2)] flex-shrink-0 flex items-center justify-center overflow-hidden">
          {judge.photo_url ? (
            <img
              src={judge.photo_url}
              alt={judge.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm font-bold text-[var(--agili-accent)]">
              {initials}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-[var(--agili-accent)] uppercase tracking-wide">
              Judge Profile
            </span>
          </div>
          <p className="text-base font-bold text-[var(--cream)] truncate">
            {judge.name}
          </p>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            {judge.location && (
              <span className="text-xs text-[var(--muted-text)]">
                {judge.location}
              </span>
            )}
            {judge.organizations.map((org) => (
              <OrgBadge key={org} orgId={org} />
            ))}
            {judge.trial_count > 0 && (
              <span className="text-xs text-[var(--muted-text)]">
                {judge.trial_count} upcoming trial{judge.trial_count !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-1 text-xs font-medium text-[var(--agili-accent)] flex-shrink-0 group-hover:gap-2 transition-all">
          View profile
          <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </Link>
  );
}
