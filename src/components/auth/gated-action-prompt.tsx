"use client";

import { useRouter } from "next/navigation";

interface GatedActionPromptProps {
  onDismiss: () => void;
}

export function GatedActionPrompt({ onDismiss }: GatedActionPromptProps) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Modal */}
      <div className="relative bg-[var(--surface)] rounded-lg border border-[var(--border)] shadow-xl p-6 max-w-sm mx-4 w-full">
        {/* Icon */}
        <div className="w-12 h-12 bg-[var(--agili-accent)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-[var(--agili-accent)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-[var(--cream)] text-center mb-2">
          Save trials to your schedule
        </h3>
        <p className="text-sm text-[var(--muted-text)] text-center mb-6">
          Create a free account to save trials and build your competition
          schedule.
        </p>

        <div className="space-y-2">
          <button
            onClick={() => router.push("/signup")}
            className="w-full bg-[var(--agili-accent)] text-black rounded-md py-2 text-sm font-medium hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[var(--agili-accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)] transition-all"
          >
            Sign up — it&apos;s free
          </button>
          <button
            onClick={() => router.push("/login")}
            className="w-full bg-[var(--surface-2)] text-[var(--cream)] border border-[var(--border)] rounded-md py-2 text-sm font-medium hover:bg-[var(--surface-3)] focus:outline-none focus:ring-2 focus:ring-[var(--agili-accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)] transition-colors"
          >
            Log in
          </button>
          <button
            onClick={onDismiss}
            className="w-full text-[var(--muted-text)] text-sm py-1.5 hover:text-[var(--cream)] transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
