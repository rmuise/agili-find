"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, User, Settings } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";

export function UserMenu() {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="h-8 w-20 bg-[var(--surface-2)] rounded animate-pulse" />
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--cream)] hover:text-[var(--agili-accent)] border border-[var(--border-2)] rounded-md hover:border-[rgba(232,255,71,0.4)] transition-colors"
      >
        <User className="h-3.5 w-3.5" />
        Log in
      </Link>
    );
  }

  const displayName =
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "User";

  return (
    <div className="flex items-center gap-1">
      <span className="text-sm text-[var(--muted-text)] hidden sm:inline mr-1">
        {displayName}
      </span>
      <Link
        href="/settings"
        className="inline-flex items-center p-1.5 text-[var(--muted-2)] hover:text-[var(--agili-accent)] rounded-md hover:bg-[var(--surface-2)] transition-colors"
        title="Settings"
      >
        <Settings className="h-3.5 w-3.5" />
      </Link>
      <button
        onClick={handleSignOut}
        className="inline-flex items-center gap-1 px-2 py-1.5 text-sm text-[var(--muted-text)] hover:text-[#f09595] rounded-md hover:bg-[rgba(240,149,149,0.08)] transition-colors"
        title="Log out"
      >
        <LogOut className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Log out</span>
      </button>
    </div>
  );
}
