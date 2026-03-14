"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Calendar,
  Search,
  Loader2,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useAuth } from "@/lib/supabase/auth-context";
import { ProviderCard } from "@/components/services/provider-card";
import { ProviderProfileForm } from "@/components/providers/provider-profile-form";
import { TrialAssociator } from "@/components/providers/trial-associator";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import type { ProviderWithAssociation, ProviderData, TrialAssociation } from "@/types/services";

type Tab = "profile" | "associations" | "find";

export default function ProviderDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("profile");
  const [provider, setProvider] = useState<ProviderData | null>(null);
  const [associations, setAssociations] = useState<TrialAssociation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasProvider, setHasProvider] = useState<boolean | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFields, setEditFields] = useState<Partial<ProviderData>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Check if user has a provider profile
  const fetchProvider = useCallback(async () => {
    if (!user) return;

    try {
      const res = await fetch("/api/providers/me");
      const data = await res.json();

      if (data.provider) {
        setProvider(data.provider);
        setHasProvider(true);
        await fetchAssociations(data.provider.id);
      } else {
        setHasProvider(false);
      }
    } catch {
      setHasProvider(false);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProvider();
  }, [fetchProvider]);

  const fetchAssociations = async (providerId: string) => {
    try {
      const res = await fetch(`/api/providers/${providerId}/trials`);
      const data = await res.json();
      setAssociations(data.trials || []);
    } catch {
      setAssociations([]);
    }
  };

  const handleProviderCreated = async (providerId: string) => {
    const res = await fetch(`/api/providers/${providerId}`);
    const data = await res.json();
    setProvider(data.provider);
    setHasProvider(true);
    await fetchAssociations(providerId);
  };

  const handleToggleAttending = async (assoc: TrialAssociation) => {
    if (!provider) return;
    setTogglingId(assoc.id);

    try {
      await fetch(`/api/providers/${provider.id}/trials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trial_id: assoc.trial_id,
          is_attending: !assoc.is_attending,
        }),
      });

      setAssociations((prev) =>
        prev.map((a) =>
          a.id === assoc.id ? { ...a, is_attending: !a.is_attending } : a
        )
      );
    } catch (err) {
      console.error("Toggle error:", err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleRemoveAssociation = async (assoc: TrialAssociation) => {
    if (!provider) return;
    setRemovingId(assoc.id);

    try {
      await fetch(
        `/api/providers/${provider.id}/trials/${assoc.trial_id}`,
        { method: "DELETE" }
      );
      setAssociations((prev) => prev.filter((a) => a.id !== assoc.id));
    } catch (err) {
      console.error("Remove error:", err);
    } finally {
      setRemovingId(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!provider) return;
    setIsSaving(true);

    try {
      const res = await fetch(`/api/providers/${provider.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFields),
      });

      if (!res.ok) throw new Error("Save failed");

      const data = await res.json();
      setProvider(data.provider);
      setIsEditing(false);
      setEditFields({});
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = () => {
    if (!provider) return;
    setEditFields({
      business_name: provider.business_name,
      contact_name: provider.contact_name,
      email: provider.email,
      phone: provider.phone,
      website_url: provider.website_url,
      description: provider.description,
      logo_url: provider.logo_url,
      location_city: provider.location_city,
      location_province: provider.location_province,
    });
    setIsEditing(true);
  };

  if (authLoading || (!user && !authLoading)) {
    return <LoadingState />;
  }

  // Show registration form if no provider profile
  if (hasProvider === false) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <PageHeader />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-[var(--cream)] mb-2">
            Register as a Provider
          </h1>
          <p className="text-sm text-[var(--muted)] mb-6">
            Create your listing so trial attendees can find your services.
          </p>
          <ProviderProfileForm onSuccess={handleProviderCreated} />
        </div>
      </div>
    );
  }

  if (isLoading || !provider) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--muted)]" />
      </div>
    );
  }

  const providerAsCardData: ProviderWithAssociation = {
    ...provider,
    is_attending: false,
    association_note: null,
  };

  const associatedTrialIds = new Set(associations.map((a) => a.trial_id));

  const tabs = [
    { key: "profile" as Tab, label: "My Profile", icon: User },
    { key: "associations" as Tab, label: "My Trials", icon: Calendar },
    { key: "find" as Tab, label: "Find a Trial", icon: Search },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <PageHeader />

      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        <h1 className="text-2xl font-bold text-[var(--cream)] mb-1">
          Provider Dashboard
        </h1>
        <p className="text-sm text-[var(--muted)] mb-6">{provider.business_name}</p>

        {/* Tabs */}
        <div className="flex gap-1 bg-[var(--surface-2)] rounded-lg p-0.5 mb-6">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === key
                  ? "bg-[var(--surface)] shadow-sm text-[var(--cream)]"
                  : "text-[var(--muted)] hover:text-[var(--cream)]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab: My Profile */}
        {tab === "profile" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--cream)]">Preview</h2>
              {!isEditing && (
                <button
                  onClick={startEditing}
                  className="text-sm text-[var(--accent)] hover:opacity-80 font-medium"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {/* Card preview */}
            <ProviderCard provider={providerAsCardData} />

            {/* Edit form */}
            {isEditing && (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-[var(--cream)]">
                  Edit Profile
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={editFields.business_name || ""}
                      onChange={(e) =>
                        setEditFields((prev) => ({
                          ...prev,
                          business_name: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-1.5 border border-[var(--border)] rounded-md text-sm text-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      value={editFields.contact_name || ""}
                      onChange={(e) =>
                        setEditFields((prev) => ({
                          ...prev,
                          contact_name: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-1.5 border border-[var(--border)] rounded-md text-sm text-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editFields.email || ""}
                      onChange={(e) =>
                        setEditFields((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-1.5 border border-[var(--border)] rounded-md text-sm text-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={editFields.phone || ""}
                      onChange={(e) =>
                        setEditFields((prev) => ({
                          ...prev,
                          phone: e.target.value || null,
                        }))
                      }
                      className="w-full px-3 py-1.5 border border-[var(--border)] rounded-md text-sm text-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                      Website
                    </label>
                    <input
                      type="url"
                      value={editFields.website_url || ""}
                      onChange={(e) =>
                        setEditFields((prev) => ({
                          ...prev,
                          website_url: e.target.value || null,
                        }))
                      }
                      className="w-full px-3 py-1.5 border border-[var(--border)] rounded-md text-sm text-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                      Logo URL
                    </label>
                    <input
                      type="url"
                      value={editFields.logo_url || ""}
                      onChange={(e) =>
                        setEditFields((prev) => ({
                          ...prev,
                          logo_url: e.target.value || null,
                        }))
                      }
                      className="w-full px-3 py-1.5 border border-[var(--border)] rounded-md text-sm text-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={editFields.location_city || ""}
                      onChange={(e) =>
                        setEditFields((prev) => ({
                          ...prev,
                          location_city: e.target.value || null,
                        }))
                      }
                      className="w-full px-3 py-1.5 border border-[var(--border)] rounded-md text-sm text-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                      Province / State
                    </label>
                    <input
                      type="text"
                      value={editFields.location_province || ""}
                      onChange={(e) =>
                        setEditFields((prev) => ({
                          ...prev,
                          location_province: e.target.value || null,
                        }))
                      }
                      className="w-full px-3 py-1.5 border border-[var(--border)] rounded-md text-sm text-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                    Description
                  </label>
                  <textarea
                    value={editFields.description || ""}
                    onChange={(e) =>
                      setEditFields((prev) => ({
                        ...prev,
                        description: e.target.value || null,
                      }))
                    }
                    rows={3}
                    className="w-full px-3 py-1.5 border border-[var(--border)] rounded-md text-sm text-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {isSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditFields({});
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-[var(--border)] text-[var(--cream)] text-sm font-medium rounded-md hover:bg-[var(--surface-2)] transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: My Trial Associations */}
        {tab === "associations" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[var(--cream)]">
              My Trial Associations
            </h2>

            {associations.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-10 w-10 text-[var(--muted-2)] mx-auto mb-3" />
                <p className="text-sm text-[var(--muted)] mb-3">
                  No trial associations yet
                </p>
                <button
                  onClick={() => setTab("find")}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:opacity-80"
                >
                  <Search className="h-3.5 w-3.5" />
                  Find a trial to associate with
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {associations.map((assoc) => (
                  <div
                    key={assoc.id}
                    className="flex items-center justify-between gap-3 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--cream)] truncate">
                        Trial: {assoc.trial_id}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        Added {format(parseISO(assoc.created_at), "MMM d, yyyy")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Attending toggle */}
                      <button
                        onClick={() => handleToggleAttending(assoc)}
                        disabled={togglingId === assoc.id}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                          assoc.is_attending
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--border)] hover:bg-[var(--surface-3)]"
                        }`}
                      >
                        {togglingId === assoc.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : assoc.is_attending ? (
                          "Attending"
                        ) : (
                          "Not Attending"
                        )}
                      </button>

                      {/* Remove */}
                      <button
                        onClick={() => handleRemoveAssociation(assoc)}
                        disabled={removingId === assoc.id}
                        className="p-1.5 text-[var(--muted)] hover:text-red-500 transition-colors"
                        title="Remove association"
                      >
                        {removingId === assoc.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Find a Trial */}
        {tab === "find" && (
          <div>
            <h2 className="text-lg font-semibold text-[var(--cream)] mb-4">
              Find a Trial
            </h2>
            <TrialAssociator
              providerId={provider.id}
              associatedTrialIds={associatedTrialIds}
              onAssociated={() => fetchAssociations(provider.id)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
