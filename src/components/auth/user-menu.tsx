"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, User } from "lucide-react";
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
      <div className="h-8 w-20 bg-gray-100 rounded animate-pulse" />
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 border border-gray-300 rounded-md hover:border-blue-300 transition-colors"
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
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 hidden sm:inline">
        {displayName}
      </span>
      <button
        onClick={handleSignOut}
        className="inline-flex items-center gap-1 px-2 py-1.5 text-sm text-gray-500 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
        title="Log out"
      >
        <LogOut className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Log out</span>
      </button>
    </div>
  );
}
