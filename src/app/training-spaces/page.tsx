"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Dumbbell, Plus, Search, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { geocodeLocation } from "@/lib/geocoding/client";
import { TrainingSpaceCard, type TrainingSpaceResult } from "@/components/search/training-space-card";

export default function TrainingSpacesPage() {
  const { user } = useAuth();
  const [spaces, setSpaces] = useState<TrainingSpaceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Search form state
  const [location, setLocation] = useState("");
  const [radius, setRadius] = useState("50");
  const [indoorFilter, setIndoorFilter] = useState<string>("");
  const [surfaceFilter, setSurfaceFilter] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();

      if (location.trim()) {
        const geo = await geocodeLocation(location);
        if (geo) {
          params.set("lat", String(geo.lat));
          params.set("lng", String(geo.lng));
          params.set("radius", radius);
        }
      }

      if (indoorFilter) params.set("indoor", indoorFilter);
      if (surfaceFilter) params.set("surface", surfaceFilter);

      const res = await fetch(`/api/training-spaces?${params.toString()}`);
      const data = await res.json();
      setSpaces(data.spaces || []);
    } catch {
      setSpaces([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AF</span>
            </div>
            <span className="text-xl font-bold text-gray-900">AgiliFind</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
            {user && (
              <Link
                href="/training-spaces/submit"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <Dumbbell className="h-7 w-7 text-emerald-600" />
            Training Spaces
          </h1>
          <p className="text-gray-600 text-sm">
            Find agility training facilities near you.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, state, or zip code"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Radius</label>
              <select
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="10">10 miles</option>
                <option value="25">25 miles</option>
                <option value="50">50 miles</option>
                <option value="100">100 miles</option>
                <option value="250">250 miles</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
              <select
                value={indoorFilter}
                onChange={(e) => setIndoorFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="true">Indoor</option>
                <option value="false">Outdoor</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Surface</label>
              <select
                value={surfaceFilter}
                onChange={(e) => setSurfaceFilter(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Any surface</option>
                <option value="grass">Grass</option>
                <option value="dirt">Dirt</option>
                <option value="rubber">Rubber</option>
                <option value="turf">Turf</option>
                <option value="sand">Sand</option>
                <option value="concrete">Concrete</option>
              </select>
            </div>
            <div className="flex-1" />
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50 self-end"
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

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-4" />
            <p className="text-gray-600">Searching...</p>
          </div>
        ) : !hasSearched ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Dumbbell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Search for training spaces
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Enter your location to find agility training facilities near you.
            </p>
          </div>
        ) : spaces.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Dumbbell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No training spaces found
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-4">
              Try expanding your search radius or adjusting your filters.
            </p>
            {user && (
              <Link
                href="/training-spaces/submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-emerald-600 border border-emerald-300 rounded-md hover:bg-emerald-50"
              >
                <Plus className="h-4 w-4" />
                Add a training space
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-4">
              {spaces.length} training space{spaces.length !== 1 ? "s" : ""} found
            </p>
            <div className="space-y-3">
              {spaces.map((space) => (
                <TrainingSpaceCard key={space.id} space={space} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
