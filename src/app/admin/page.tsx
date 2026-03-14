"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  BookOpen,
  Dumbbell,
  Check,
  X,
  Clock,
  MapPin,
  BadgeCheck,
  Store,
} from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingState } from "@/components/ui/loading-state";

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

interface UnverifiedProvider {
  id: string;
  business_name: string;
  provider_type: string;
  contact_name: string;
  email: string;
  location_city: string | null;
  location_province: string | null;
  is_verified: boolean;
  created_at: string;
}

type Tab = "all" | "pending" | "approved" | "rejected";

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [seminars, setSeminars] = useState<ModItem[]>([]);
  const [trainingSpaces, setTrainingSpaces] = useState<ModItem[]>([]);
  const [unverifiedProviders, setUnverifiedProviders] = useState<UnverifiedProvider[]>([]);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
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

    Promise.all([
      fetch("/api/admin/moderate").then((res) => {
        if (res.status === 403) {
          setError("You do not have admin access.");
          return null;
        }
        return res.json();
      }),
      fetch("/api/providers").then((res) => res.json()),
    ])
      .then(([modData, provData]) => {
        if (modData) {
          setSeminars(modData.seminars || []);
          setTrainingSpaces(modData.trainingSpaces || []);
        }
        if (provData?.providers) {
          setUnverifiedProviders(
            provData.providers.filter((p: UnverifiedProvider) => !p.is_verified)
          );
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

  const handleVerifyProvider = async (providerId: string) => {
    setVerifyingId(providerId);
    const res = await fetch(`/api/providers/${providerId}/verify`, {
      method: "PATCH",
    });
    if (res.ok) {
      toast("Provider verified", "success");
      setUnverifiedProviders((prev) => prev.filter((p) => p.id !== providerId));
    } else {
      toast("Failed to verify provider", "error");
    }
    setVerifyingId(null);
  };

  const filterByTab = (items: ModItem[]) => {
    if (tab === "all") return items;
    return items.filter((i) => i.status === tab);
  };

  const filteredSeminars = filterByTab(seminars);
  const filteredSpaces = filterByTab(trainingSpaces);
  const pendingCount =
    seminars.filter((s) => s.status === "pending").length +
    trainingSpaces.filter((s) => s.status === "pending").length +
    unverifiedProviders.length;

  if (authLoading || !user) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-[var(--cream)] mb-2">{error}</h2>
          <Link href="/" className="text-sm text-[var(--accent)] hover:opacity-80">
            Back to search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <PageHeader maxWidth="5xl" backLabel="Back" />

      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--cream)] flex items-center gap-2">
            <Shield className="h-6 w-6 text-[var(--accent)]" />
            Moderation Dashboard
          </h1>
          <p className="text-sm text-[var(--muted-text)] mt-1">
            {pendingCount} item{pendingCount !== 1 ? "s" : ""} pending review
          </p>
        </div>

        {/* Tab filters */}
        <div className="flex gap-1 bg-[var(--surface-2)] rounded-lg p-0.5 mb-6 w-fit">
          {(["pending", "approved", "rejected", "all"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                tab === t
                  ? "bg-[var(--surface)] shadow-sm text-[var(--cream)]"
                  : "text-[var(--muted-text)] hover:text-[var(--cream)]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[var(--surface)] rounded-lg border p-4 animate-pulse">
                <div className="h-4 bg-[var(--surface-2)] rounded w-1/3 mb-3" />
                <div className="h-3 bg-[var(--surface-3)] rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Seminars */}
            {filteredSeminars.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-[var(--muted-text)] uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  Seminars ({filteredSeminars.length})
                </h2>
                <div className="space-y-2">
                  {filteredSeminars.map((sem) => (
                    <div
                      key={sem.id}
                      className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-4 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-medium text-[var(--cream)]">
                            {sem.title}
                          </span>
                          <StatusBadge status={sem.status} />
                        </div>
                        <div className="flex flex-wrap gap-x-3 text-xs text-[var(--muted-text)]">
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
                <h2 className="text-sm font-semibold text-[var(--muted-text)] uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Dumbbell className="h-3.5 w-3.5" />
                  Training Spaces ({filteredSpaces.length})
                </h2>
                <div className="space-y-2">
                  {filteredSpaces.map((space) => (
                    <div
                      key={space.id}
                      className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-4 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-medium text-[var(--cream)]">
                            {space.name}
                          </span>
                          <StatusBadge status={space.status} />
                        </div>
                        <div className="flex flex-wrap gap-x-3 text-xs text-[var(--muted-text)]">
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

            {/* Unverified Providers */}
            {tab === "pending" && unverifiedProviders.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-[var(--muted-text)] uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5" />
                  Unverified Providers ({unverifiedProviders.length})
                </h2>
                <div className="space-y-2">
                  {unverifiedProviders.map((prov) => (
                    <div
                      key={prov.id}
                      className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-4 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-medium text-[var(--cream)]">
                            {prov.business_name}
                          </span>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--muted-text)] capitalize">
                            {prov.provider_type.replace("_", " ")}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 text-xs text-[var(--muted-text)]">
                          <span>{prov.contact_name}</span>
                          <span>{prov.email}</span>
                          {prov.location_city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {prov.location_city}
                              {prov.location_province
                                ? `, ${prov.location_province}`
                                : ""}
                            </span>
                          )}
                          <span>
                            {new Date(prov.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleVerifyProvider(prov.id)}
                        disabled={verifyingId === prov.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 disabled:opacity-50 transition-colors"
                      >
                        <BadgeCheck className="h-3.5 w-3.5" />
                        {verifyingId === prov.id ? "Verifying..." : "Verify"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredSeminars.length === 0 && filteredSpaces.length === 0 && (tab !== "pending" || unverifiedProviders.length === 0) && (
              <div className="text-center py-16 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                <Clock className="h-12 w-12 text-[var(--muted-2)] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[var(--cream)] mb-2">
                  No items to review
                </h3>
                <p className="text-[var(--muted-text)]">
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
        styles[status] || "bg-[var(--surface-2)] text-[var(--muted-text)]"
      }`}
    >
      {status}
    </span>
  );
}
