"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Dumbbell, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { useAuth } from "@/lib/supabase/auth-context";
import { geocodeLocation } from "@/lib/geocoding/client";

export default function SubmitTrainingSpacePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [surfaceType, setSurfaceType] = useState("");
  const [indoor, setIndoor] = useState(false);
  const [hasEquipment, setHasEquipment] = useState(false);
  const [equipmentDetails, setEquipmentDetails] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("US");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [rentalInfo, setRentalInfo] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setSurfaceType("");
    setIndoor(false);
    setHasEquipment(false);
    setEquipmentDetails("");
    setAddress("");
    setCity("");
    setState("");
    setContactEmail("");
    setContactPhone("");
    setWebsite("");
    setRentalInfo("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      let lat: number | null = null;
      let lng: number | null = null;
      const locationStr = `${city}, ${state}, ${country}`;
      const geo = await geocodeLocation(locationStr);
      if (geo) {
        lat = geo.lat;
        lng = geo.lng;
      }

      const res = await fetch("/api/training-spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          surface_type: surfaceType || null,
          indoor,
          has_equipment: hasEquipment,
          equipment_details: equipmentDetails,
          address,
          city,
          state,
          country,
          lat,
          lng,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          website,
          rental_info: rentalInfo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit training space");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || (!user && !authLoading)) {
    return <LoadingState />;
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <PageHeader backLabel="Back" />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--cream)] mb-2">
            Training space submitted!
          </h1>
          <p className="text-[var(--muted)] mb-6">
            Your training space is now listed and will appear in the directory.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setSuccess(false);
                resetForm();
              }}
              className="px-4 py-2 text-sm font-medium text-[var(--accent)] border border-[var(--accent)] rounded-md hover:bg-[var(--surface-2)]"
            >
              Submit another
            </button>
            <Link
              href="/training-spaces"
              className="px-4 py-2 text-sm font-medium text-[var(--black)] bg-[var(--accent)] rounded-md hover:bg-[var(--accent-dark)]"
            >
              Browse spaces
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <PageHeader backLabel="Back" />

      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--cream)] flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-[var(--accent)]" />
            Add a Training Space
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Share a training facility with the agility community.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--cream)] mb-1">
              Facility name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Happy Paws Agility Field"
              required
              className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--cream)] mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe the facility, size, availability, etc."
              className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
            />
          </div>

          {/* Type + Surface */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--cream)] mb-1">
                Environment
              </label>
              <div className="flex items-center gap-3 mt-1.5">
                <label className="inline-flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={indoor}
                    onChange={(e) => setIndoor(e.target.checked)}
                    className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                  />
                  Indoor
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--cream)] mb-1">
                Surface type
              </label>
              <select
                value={surfaceType}
                onChange={(e) => setSurfaceType(e.target.value)}
                className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              >
                <option value="">Select...</option>
                <option value="grass">Grass</option>
                <option value="dirt">Dirt</option>
                <option value="rubber">Rubber</option>
                <option value="turf">Turf</option>
                <option value="sand">Sand</option>
                <option value="concrete">Concrete</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--cream)] mb-1">
                Equipment
              </label>
              <div className="flex items-center gap-1.5 mt-1.5">
                <label className="inline-flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasEquipment}
                    onChange={(e) => setHasEquipment(e.target.checked)}
                    className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                  />
                  Has agility equipment
                </label>
              </div>
            </div>
          </div>

          {/* Equipment details (conditional) */}
          {hasEquipment && (
            <div>
              <label className="block text-sm font-medium text-[var(--cream)] mb-1">
                Equipment details
              </label>
              <input
                type="text"
                value={equipmentDetails}
                onChange={(e) => setEquipmentDetails(e.target.value)}
                placeholder="e.g. Full set of jumps, tunnels, weaves, A-frame"
                className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              />
            </div>
          )}

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-[var(--cream)] mb-1">
              Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St"
              className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--cream)] mb-1">
                City *
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--cream)] mb-1">
                State *
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. CA"
                required
                className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--cream)] mb-1">
                Country
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              />
            </div>
          </div>

          {/* Contact + Rental */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--cream)] mb-1">
                Contact email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--cream)] mb-1">
                Contact phone
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--cream)] mb-1">
                Website
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--cream)] mb-1">
                Rental info
              </label>
              <input
                type="text"
                value={rentalInfo}
                onChange={(e) => setRentalInfo(e.target.value)}
                placeholder="e.g. $25/hr, members only, free"
                className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[var(--accent)] text-[var(--black)] rounded-md py-2.5 text-sm font-medium hover:bg-[var(--accent-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit training space"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
