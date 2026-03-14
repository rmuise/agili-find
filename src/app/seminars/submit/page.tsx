"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { useAuth } from "@/lib/supabase/auth-context";
import { geocodeLocation } from "@/lib/geocoding/client";

export default function SubmitSeminarPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructor, setInstructor] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("US");
  const [contactEmail, setContactEmail] = useState("");
  const [contactUrl, setContactUrl] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Try to geocode the location
      let lat: number | null = null;
      let lng: number | null = null;
      const locationStr = `${city}, ${state}, ${country}`;
      const geo = await geocodeLocation(locationStr);
      if (geo) {
        lat = geo.lat;
        lng = geo.lng;
      }

      const res = await fetch("/api/seminars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          instructor,
          start_date: startDate,
          end_date: endDate || startDate,
          venue_name: venueName,
          address,
          city,
          state,
          country,
          lat,
          lng,
          contact_email: contactEmail,
          contact_url: contactUrl,
          price,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit seminar");
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
            <BookOpen className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--cream)] mb-2">
            Seminar submitted!
          </h1>
          <p className="text-[var(--muted)] mb-6">
            Your seminar is now listed and will appear in search results.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/seminars/submit"
              onClick={() => {
                setSuccess(false);
                setTitle("");
                setDescription("");
                setInstructor("");
                setStartDate("");
                setEndDate("");
                setVenueName("");
                setAddress("");
                setCity("");
                setState("");
                setContactEmail("");
                setContactUrl("");
                setPrice("");
              }}
              className="px-4 py-2 text-sm font-medium text-[var(--accent)] border border-[var(--accent)] rounded-md hover:bg-[var(--surface-2)]"
            >
              Submit another
            </Link>
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-[var(--black)] bg-[var(--accent)] rounded-md hover:bg-[var(--accent-dark)]"
            >
              Back to search
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
            <BookOpen className="h-6 w-6 text-[var(--accent)]" />
            Submit a Seminar
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Share an agility seminar or clinic with the community.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6 space-y-5">
          {/* Title + Instructor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--cream)] mb-1">
                Seminar title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Agility Foundations Clinic"
                required
                className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--cream)] mb-1">
                Instructor *
              </label>
              <input
                type="text"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                placeholder="e.g. Jane Smith"
                required
                className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              />
            </div>
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
              placeholder="What will be covered, skill levels welcome, etc."
              className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--cream)] mb-1">
                Start date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--cream)] mb-1">
                End date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
                className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              />
              <p className="text-xs text-[var(--muted-2)] mt-0.5">Same as start if single-day</p>
            </div>
          </div>

          {/* Venue */}
          <div>
            <label className="block text-sm font-medium text-[var(--cream)] mb-1">
              Venue name *
            </label>
            <input
              type="text"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="e.g. Paws & Play Training Center"
              required
              className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
            />
          </div>

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

          {/* Contact + Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                Website / signup link
              </label>
              <input
                type="url"
                value={contactUrl}
                onChange={(e) => setContactUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--cream)] mb-1">
                Price
              </label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. $150/day"
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
              "Submit seminar"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
