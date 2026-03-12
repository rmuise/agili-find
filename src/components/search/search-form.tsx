"use client";

import { useState, useCallback } from "react";
import { Search, MapPin, Calendar, Filter, Loader2 } from "lucide-react";
import type { OrganizationId } from "@/types/trial";

const ORGANIZATIONS: Array<{
  id: OrganizationId;
  name: string;
  color: string;
}> = [
  { id: "akc", name: "AKC", color: "bg-blue-500" },
  { id: "usdaa", name: "USDAA", color: "bg-red-500" },
  { id: "cpe", name: "CPE", color: "bg-green-500" },
  { id: "nadac", name: "NADAC", color: "bg-purple-500" },
  { id: "uki", name: "UKI", color: "bg-orange-500" },
  { id: "ckc", name: "CKC", color: "bg-pink-500" },
];

const RADIUS_OPTIONS = [
  { value: "25", label: "25 mi" },
  { value: "50", label: "50 mi" },
  { value: "100", label: "100 mi" },
  { value: "200", label: "200 mi" },
  { value: "any", label: "Any" },
];

export interface SearchFormValues {
  location: string;
  radius: string;
  orgs: OrganizationId[];
  startDate: string;
  judge: string;
}

interface SearchFormProps {
  onSearch: (values: SearchFormValues) => void;
  isLoading: boolean;
}

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [location, setLocation] = useState("");
  const [radius, setRadius] = useState("100");
  const [selectedOrgs, setSelectedOrgs] = useState<Set<OrganizationId>>(
    new Set(ORGANIZATIONS.map((o) => o.id))
  );
  const [startDate, setStartDate] = useState("");
  const [judge, setJudge] = useState("");

  const toggleOrg = useCallback((orgId: OrganizationId) => {
    setSelectedOrgs((prev) => {
      const next = new Set(prev);
      if (next.has(orgId)) {
        next.delete(orgId);
      } else {
        next.add(orgId);
      }
      return next;
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      location,
      radius,
      orgs: [...selectedOrgs],
      startDate,
      judge,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-6 space-y-4">
      {/* Location + Radius Row */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, state, or zip code..."
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <select
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
          className="px-4 py-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          {RADIUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Organization Filters */}
      <div className="flex flex-wrap gap-2">
        {ORGANIZATIONS.map((org) => (
          <label
            key={org.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
              selectedOrgs.has(org.id)
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 bg-white hover:border-gray-400"
            }`}
          >
            <input
              type="checkbox"
              checked={selectedOrgs.has(org.id)}
              onChange={() => toggleOrg(org.id)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className={`w-2 h-2 rounded-full ${org.color}`}></span>
            <span className="text-sm font-medium text-gray-700">
              {org.name}
            </span>
          </label>
        ))}
      </div>

      {/* Date Range + Judge + Search */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={judge}
            onChange={(e) => setJudge(e.target.value)}
            placeholder="Judge name..."
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Search
        </button>
      </div>
    </form>
  );
}
