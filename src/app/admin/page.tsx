"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  BookOpen,
  Dumbbell,
  Check,
  X,
  Clock,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { useToast } from "@/components/ui/toast";

interface ModItem {
  id: string;
  title?: string;
  name?: string;
  instructor?: string;
  city: string;
  state: string;
  status: string;
  created_at: string;
  user_id: string;
  profiles?: { display_name: string } | null;
}

type Tab = "all" | "pending" | "approved" | "rejected";

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [seminars, setSeminars] = useState<ModItem[]>([]);
  const [trainingSpaces, setTrainingSpaces] = useState<ModItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("pending");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/admin/moderate")
      .then((res) => {
        if (res.status === 403) {
          setError("You do not have admin access.");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setSeminars(data.seminars || []);
          setTrainingSpaces(data.trainingSpaces || []);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [user]);

  const handleModerate = async (
    type: "seminar" | "training_space",
    id: string,
    status: string
  ) => {
    const res = await fetch("/api/admin/moderate", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id, status }),
    });

    if (res.ok) {
      toast(`Item ${status}`, "success");
      if (type === "seminar") {
        setSeminars((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status } : s))
        );
      } else {
        setTrainingSpaces((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status } : s))
        );
      }
    } else {
      toast("Failed to update status", "error");
    }
  };

  const filterByTab = (items: ModItem[]) => {
    if (tab === "all") return items;
    return items.filter((i) => i.status === tab);
  };

  const filteredSeminars = filterByTab(seminars);
  const filteredSpaces = filterByTab(trainingSpaces);
  const pendingCount =
    seminars.filter((s) => s.status === "pending").length +
    trainingSpaces.filter((s) => s.status === "pending").length;

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">{error}</h2>
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-700">
            Back to search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AF</span>
            </div>
            <span className="text-xl font-bold text-gray-900">AgiliFind</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Moderation Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {pendingCount} item{pendingCount !== 1 ? "s" : ""} pending review
          </p>
        </div>

        {/* Tab filters */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 mb-6 w-fit">
          {(["pending", "approved", "rejected", "all"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                tab === t
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Seminars */}
            {filteredSeminars.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  Seminars ({filteredSeminars.length})
                </h2>
                <div className="space-y-2">
                  {filteredSeminars.map((sem) => (
                    <div
                      key={sem.id}
                      className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-medium text-gray-900">
                            {sem.title}
                          </span>
                          <StatusBadge status={sem.status} />
                        </div>
                        <div className="flex flex-wrap gap-x-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {sem.city}, {sem.state}
                          </span>
                          {sem.instructor && (
                            <span>by {sem.instructor}</span>
                          )}
                          <span>
                            Submitted by{" "}
                            {sem.profiles?.display_name || "Unknown"}
                          </span>
                          <span>
                            {new Date(sem.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {sem.status !== "approved" && (
                          <button
                            onClick={() => handleModerate("seminar", sem.id, "approved")}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                            title="Approve"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        {sem.status !== "rejected" && (
                          <button
                            onClick={() => handleModerate("seminar", sem.id, "rejected")}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Reject"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Training Spaces */}
            {filteredSpaces.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Dumbbell className="h-3.5 w-3.5" />
                  Training Spaces ({filteredSpaces.length})
                </h2>
                <div className="space-y-2">
                  {filteredSpaces.map((space) => (
                    <div
                      key={space.id}
                      className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-medium text-gray-900">
                            {space.name}
                          </span>
                          <StatusBadge status={space.status} />
                        </div>
                        <div className="flex flex-wrap gap-x-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {space.city}, {space.state}
                          </span>
                          <span>
                            Submitted by{" "}
                            {space.profiles?.display_name || "Unknown"}
                          </span>
                          <span>
                            {new Date(space.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {space.status !== "approved" && (
                          <button
                            onClick={() =>
                              handleModerate("training_space", space.id, "approved")
                            }
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                            title="Approve"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        {space.status !== "rejected" && (
                          <button
                            onClick={() =>
                              handleModerate("training_space", space.id, "rejected")
                            }
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Reject"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredSeminars.length === 0 && filteredSpaces.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No items to review
                </h3>
                <p className="text-gray-500">
                  {tab === "pending"
                    ? "All submissions have been reviewed."
                    : "No items match this filter."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-700",
    approved: "bg-green-50 text-green-700",
    rejected: "bg-red-50 text-red-700",
  };
  return (
    <span
      className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${
        styles[status] || "bg-gray-50 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
}
