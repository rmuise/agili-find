"use client";

import { useState } from "react";
import { Search, Plus, Check, Loader2, Calendar, MapPin } from "lucide-react";
import type { TrialResult } from "@/types/search";
import { OrgChip as OrgBadge } from "@/components/ui/OrgChip";
import { formatTrialDateRange } from "@/lib/utils";

interface TrialAssociatorProps {
  providerId: string;
  associatedTrialIds: Set<string>;
  onAssociated: () => void;
}

export function TrialAssociator({
  providerId,
  associatedTrialIds,
  onAssociated,
}: TrialAssociatorProps) {
  const [query, setQuery] = useState("");
  const [orgFilter, setOrgFilter] = useState("");
  const [results, setResults] = useState<TrialResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [associatingId, setAssociatingId] = useState<string | null>(null);
  const [attendingToggles, setAttendingToggles] = useState<Record<string, boolean>>({});

  const handleSearch = async () => {
    if (!query.trim() && !orgFilter) return;

    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      if (orgFilter) params.set("orgs", orgFilter);
      // Use a wide date range for upcoming trials
      params.set("startDate", new Date().toISOString().split("T")[0]);
      params.set("limit", "20");

      const res = await fetch(`/api/trials?${params}`);
      const data = await res.json();

      let trials: TrialResult[] = data.trials || [];

      // Client-side keyword filter
      if (query.trim()) {
        const q = query.toLowerCase();
        trials = trials.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            (t.hosting_club && t.hosting_club.toLowerCase().includes(q)) ||
            t.venue_name.toLowerCase().includes(q) ||
            t.city.toLowerCase().includes(q) ||
            t.state.toLowerCase().includes(q)
        );
      }

      setResults(trials);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAssociate = async (trialId: string) => {
    setAssociatingId(trialId);
    try {
      const res = await fetch(`/api/providers/${providerId}/trials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trial_id: trialId,
          is_attending: attendingToggles[trialId] ?? false,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to associate");
      }

      onAssociated();
    } catch (err) {
      console.error("Association error:", err);
    } finally {
      setAssociatingId(null);
    }
  };


  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by name, club, city..."
          />
        </div>
        <select
          value={orgFilter}
          onChange={(e) => setOrgFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Orgs</option>
          {["akc", "usdaa", "cpe", "nadac", "uki", "ckc", "aac", "tdaa"].map(
            (org) => (
              <option key={org} value={org}>
                {org.toUpperCase()}
              </option>
            )
          )}
        </select>
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Search"
          )}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            {results.length} trial{results.length !== 1 ? "s" : ""} found
          </p>
          {results.map((trial) => {
            const isAlready = associatedTrialIds.has(trial.id);

            return (
              <div
                key={trial.id}
                className="flex items-center justify-between gap-3 p-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <OrgBadge orgId={trial.organization_id} className="px-1.5 text-[10px]" />
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {trial.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatTrialDateRange(trial.start_date, trial.end_date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {trial.city}, {trial.state}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!isAlready && (
                    <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={attendingToggles[trial.id] ?? false}
                        onChange={(e) =>
                          setAttendingToggles((prev) => ({
                            ...prev,
                            [trial.id]: e.target.checked,
                          }))
                        }
                        className="rounded border-gray-300"
                      />
                      I&apos;ll Be There
                    </label>
                  )}
                  <button
                    onClick={() => handleAssociate(trial.id)}
                    disabled={isAlready || associatingId === trial.id}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      isAlready
                        ? "bg-green-50 text-green-700 border border-green-200 cursor-default"
                        : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    }`}
                  >
                    {isAlready ? (
                      <>
                        <Check className="h-3 w-3" />
                        Associated
                      </>
                    ) : associatingId === trial.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-3 w-3" />
                        Associate
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {results.length === 0 && !isSearching && (
        <p className="text-sm text-gray-500 text-center py-8">
          Search for upcoming trials to associate your listing
        </p>
      )}
    </div>
  );
}
