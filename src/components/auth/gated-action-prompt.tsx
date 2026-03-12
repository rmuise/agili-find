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
      <div className="relative bg-white rounded-lg border border-gray-200 shadow-xl p-6 max-w-sm mx-4 w-full">
        {/* Icon */}
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-blue-600"
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

        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
          Save trials to your schedule
        </h3>
        <p className="text-sm text-gray-600 text-center mb-6">
          Create a free account to save trials and build your competition
          schedule.
        </p>

        <div className="space-y-2">
          <button
            onClick={() => router.push("/signup")}
            className="w-full bg-blue-600 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Sign up — it&apos;s free
          </button>
          <button
            onClick={() => router.push("/login")}
            className="w-full bg-white text-gray-700 border border-gray-300 rounded-md py-2 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Log in
          </button>
          <button
            onClick={onDismiss}
            className="w-full text-gray-500 text-sm py-1.5 hover:text-gray-700 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
