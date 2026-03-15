"use client";

import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-context";
import { useSavedTrials } from "@/lib/hooks/saved-trials-context";
import { QUICK_LINKS } from "@/lib/nav";

export function NavLinks() {
  const { user } = useAuth();
  const { savedMap } = useSavedTrials();
  const savedCount = savedMap.size;

  return (
    <div className="flex items-center gap-1">
      {QUICK_LINKS.map(({ href, label, icon: Icon, authRequired }) => {
        if (authRequired && !user) return null;
        const isSchedule = href === "/schedule";
        const hoverColor = authRequired
          ? "hover:text-[var(--cream)]"
          : "hover:text-[var(--cpe)]";

        return (
          <Link
            key={href}
            href={href}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-[var(--muted-text)] ${hoverColor} rounded-md hover:bg-[var(--surface-2)] transition-colors`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
            {isSchedule && savedCount > 0 && (
              <span className="bg-[rgba(232,255,71,0.12)] text-[var(--agili-accent)] text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {savedCount}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
