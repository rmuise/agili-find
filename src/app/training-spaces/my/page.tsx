"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Dumbbell, Plus, Trash2, MapPin, Home, Trees } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { useAuth } from "@/lib/supabase/auth-context";
import { createClient } from "@/lib/supabase/client";

interface MyTrainingSpace {
  id: string;
  name: string;
  city: string;
  state: string;
  indoor: boolean;
  surface_type: string | null;
  has_equipment: boolean;
  status: string;
  created_at: string;
}

export default function MyTrainingSpacesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [spaces, setSpaces] = useState<MyTrainingSpace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSpaces = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("training_spaces")
      .select("id, name, city, state, indoor, surface_type, has_equipment, status, created_at")
      .order("created_at", { ascending: false });
    setSpaces(data || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (user) {
      fetchSpaces();
    }
  }, [user, authLoading, router, fetchSpaces]);

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/training-spaces/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSpaces((prev) => prev.filter((s) => s.id !== id));
    }
  };

  if (authLoading || (!user && !authLoading)) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader backLabel="Back" />

      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Dumbbell className="h-6 w-6 text-emerald-600" />
              My Training Spaces
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your listed training facilities.
            </p>
          </div>
          <Link
            href="/training-spaces/submit"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Add new
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
          </div>
        ) : spaces.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Dumbbell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No training spaces yet
            </h3>
            <p className="text-gray-500 mb-4">
              Share a training facility with the agility community.
            </p>
            <Link
              href="/training-spaces/submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Add a training space
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {spaces.map((space) => (
              <div
                key={space.id}
                className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 truncate">
                      {space.name}
                    </h3>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                        space.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : space.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {space.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {space.city}, {space.state}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      {space.indoor ? (
                        <><Home className="h-3 w-3" /> Indoor</>
                      ) : (
                        <><Trees className="h-3 w-3" /> Outdoor</>
                      )}
                    </span>
                    {space.surface_type && (
                      <span className="capitalize">{space.surface_type}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(space.id)}
                  className="ml-3 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
