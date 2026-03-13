"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "@/lib/supabase/auth-context";
import { useToast } from "@/components/ui/toast";

interface SavedTrialsContextValue {
  savedMap: Map<string, string>; // trialId → status
  isSaved: (trialId: string) => boolean;
  getStatus: (trialId: string) => string | null;
  toggleSave: (trialId: string) => Promise<void>;
  updateStatus: (trialId: string, status: string) => Promise<void>;
  isLoading: boolean;
}

const SavedTrialsContext = createContext<SavedTrialsContextValue | undefined>(
  undefined
);

export function SavedTrialsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedMap, setSavedMap] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  // Fetch saved trials when user logs in
  useEffect(() => {
    if (!user) {
      setSavedMap(new Map());
      return;
    }

    setIsLoading(true);
    fetch("/api/saved-trials")
      .then((res) => res.json())
      .then((data) => {
        const map = new Map<string, string>();
        if (data.savedTrials) {
          for (const item of data.savedTrials) {
            map.set(item.trial_id, item.status);
          }
        }
        setSavedMap(map);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [user]);

  const isSaved = useCallback(
    (trialId: string) => savedMap.has(trialId),
    [savedMap]
  );

  const getStatus = useCallback(
    (trialId: string) => savedMap.get(trialId) ?? null,
    [savedMap]
  );

  const toggleSave = useCallback(
    async (trialId: string) => {
      if (savedMap.has(trialId)) {
        // Optimistic unsave
        setSavedMap((prev) => {
          const next = new Map(prev);
          next.delete(trialId);
          return next;
        });

        const res = await fetch(`/api/saved-trials/${trialId}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          setSavedMap((prev) => {
            const next = new Map(prev);
            next.set(trialId, "interested");
            return next;
          });
          toast("Failed to remove trial", "error");
        } else {
          toast("Trial removed from schedule", "info");
        }
      } else {
        // Optimistic save
        setSavedMap((prev) => {
          const next = new Map(prev);
          next.set(trialId, "interested");
          return next;
        });

        const res = await fetch(`/api/saved-trials/${trialId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "interested" }),
        });
        if (!res.ok) {
          setSavedMap((prev) => {
            const next = new Map(prev);
            next.delete(trialId);
            return next;
          });
          toast("Failed to save trial", "error");
        } else {
          toast("Trial saved to schedule", "success");
        }
      }
    },
    [savedMap, toast]
  );

  const updateStatus = useCallback(
    async (trialId: string, status: string) => {
      const prevStatus = savedMap.get(trialId);

      // Optimistic update
      setSavedMap((prev) => {
        const next = new Map(prev);
        next.set(trialId, status);
        return next;
      });

      const res = await fetch(`/api/saved-trials/${trialId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok && prevStatus) {
        // Revert on failure
        setSavedMap((prev) => {
          const next = new Map(prev);
          next.set(trialId, prevStatus);
          return next;
        });
      }
    },
    [savedMap]
  );

  return (
    <SavedTrialsContext.Provider
      value={{ savedMap, isSaved, getStatus, toggleSave, updateStatus, isLoading }}
    >
      {children}
    </SavedTrialsContext.Provider>
  );
}

export function useSavedTrials() {
  const context = useContext(SavedTrialsContext);
  if (context === undefined) {
    throw new Error(
      "useSavedTrials must be used within a SavedTrialsProvider"
    );
  }
  return context;
}
