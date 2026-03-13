"use client";

import Link from "next/link";
import { Calendar, BookOpen, Building } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { useSavedTrials } from "@/lib/hooks/saved-trials-context";

export function NavLinks() {
  const { user } = useAuth();
  const { savedMap } = useSavedTrials();
  const savedCount = savedMap.size;

  return (
    <div className="flex items-center gap-1">
      {user && (
        <>
          <Link
            href="/schedule"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-[var(--muted-text)] hover:text-[var(--cream)] rounded-md hover:bg-[var(--surface-2)] transition-colors"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">My Schedule</span>
            {savedCount > 0 && (
              <span className="bg-[rgba(232,255,71,0.12)] text-[var(--agili-accent)] text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {savedCount}
              </span>
            )}
          </Link>
          <Link
            href="/seminars/my"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-[var(--muted-text)] hover:text-[var(--cream)] rounded-md hover:bg-[var(--surface-2)] transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">My Seminars</span>
          </Link>
        </>
      )}
      <Link
        href="/training-spaces"
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-[var(--muted-text)] hover:text-[var(--cpe)] rounded-md hover:bg-[var(--surface-2)] transition-colors"
      >
        <Building className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Training</span>
      </Link>
    </div>
  );
}
