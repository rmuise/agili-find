"use client";

import Link from "next/link";
import { Calendar, BookOpen } from "lucide-react";
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
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">My Schedule</span>
            {savedCount > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {savedCount}
              </span>
            )}
          </Link>
          <Link
            href="/seminars/my"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 rounded-md hover:bg-gray-50 transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">My Seminars</span>
          </Link>
        </>
      )}
    </div>
  );
}
