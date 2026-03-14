"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <AlertTriangle className="h-12 w-12 text-[var(--accent)] mx-auto mb-4 opacity-80" />
        <h1 className="font-display text-[2rem] tracking-[0.04em] text-cream mb-2">
          Something went wrong
        </h1>
        <p className="text-[var(--muted-text)] text-[0.9rem] mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-[0.6rem] text-[0.85rem] font-medium text-black bg-[var(--accent)] hover:bg-[var(--accent-dark)] rounded-[10px] transition-colors active:scale-[0.96]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </button>
      </div>
    </div>
  );
}
