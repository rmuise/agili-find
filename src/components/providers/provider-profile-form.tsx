"use client";

import { useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Upload,
  Check,
  Loader2,
  Globe,
  Phone,
  Mail,
  User,
  MapPin,
  Building2,
} from "lucide-react";

import { PROVIDER_TYPES } from "@/lib/constants";

const ORGS = ["AKC", "USDAA", "CPE", "NADAC", "UKI", "CKC", "AAC", "TDAA"];
const MODALITIES = ["Massage", "Chiropractic", "Physiotherapy", "Acupuncture", "Other"];
const FACILITY_TYPES = ["Indoor", "Outdoor", "Both"];

interface CoreFields {
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  provider_type: string;
  description: string;
  location_city: string;
  location_province: string;
  website_url: string;
}

interface TypeSpecificFields {
  // Club
  affiliated_org: string;
  club_membership_url: string;
  // Presenter
  topics: string;
  booking_link: string;
  credentials: string;
  // Facility
  disciplines: string;
  class_schedule_url: string;
  facility_type: string;
  // Body Worker
  modalities: string[];
  certification_body: string;
  at_trial_available: boolean;
  // Vendor
  product_categories: string;
  online_shop_url: string;
  demo_at_trial: boolean;
  // Photographer
  portfolio_url: string;
  packages_offered: string;
  deposit_required: boolean;
}

interface ProviderProfileFormProps {
  onSuccess: (providerId: string) => void;
}

export function ProviderProfileForm({ onSuccess }: ProviderProfileFormProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [core, setCore] = useState<CoreFields>({
    business_name: "",
    contact_name: "",
    email: "",
    phone: "",
    provider_type: "",
    description: "",
    location_city: "",
    location_province: "",
    website_url: "",
  });

  const [typeFields, setTypeFields] = useState<TypeSpecificFields>({
    affiliated_org: "",
    club_membership_url: "",
    topics: "",
    booking_link: "",
    credentials: "",
    disciplines: "",
    class_schedule_url: "",
    facility_type: "",
    modalities: [],
    certification_body: "",
    at_trial_available: false,
    product_categories: "",
    online_shop_url: "",
    demo_at_trial: false,
    portfolio_url: "",
    packages_offered: "",
    deposit_required: false,
  });

  const [logoUrl, setLogoUrl] = useState("");

  const updateCore = (field: keyof CoreFields, value: string) => {
    setCore((prev) => ({ ...prev, [field]: value }));
  };

  const updateType = <K extends keyof TypeSpecificFields>(
    field: K,
    value: TypeSpecificFields[K]
  ) => {
    setTypeFields((prev) => ({ ...prev, [field]: value }));
  };

  // Step 1 validation
  const isStep1Valid = () => {
    if (!core.business_name || !core.contact_name || !core.email || !core.provider_type)
      return false;
    if (
      (core.provider_type === "club" || core.provider_type === "facility") &&
      (!core.location_city || !core.location_province)
    )
      return false;
    if (core.provider_type === "body_worker" && !core.location_city) return false;
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    // Build description with type-specific info appended
    let fullDescription = core.description;
    const extras: string[] = [];

    switch (core.provider_type) {
      case "club":
        if (typeFields.affiliated_org) extras.push(`Org: ${typeFields.affiliated_org}`);
        if (typeFields.club_membership_url)
          extras.push(`Membership: ${typeFields.club_membership_url}`);
        break;
      case "presenter":
        if (typeFields.topics) extras.push(`Topics: ${typeFields.topics}`);
        if (typeFields.credentials) extras.push(`Credentials: ${typeFields.credentials}`);
        if (typeFields.booking_link)
          extras.push(`Booking: ${typeFields.booking_link}`);
        break;
      case "facility":
        if (typeFields.disciplines)
          extras.push(`Disciplines: ${typeFields.disciplines}`);
        if (typeFields.facility_type)
          extras.push(`Type: ${typeFields.facility_type}`);
        if (typeFields.class_schedule_url)
          extras.push(`Schedule: ${typeFields.class_schedule_url}`);
        break;
      case "body_worker":
        if (typeFields.modalities.length)
          extras.push(`Modalities: ${typeFields.modalities.join(", ")}`);
        if (typeFields.certification_body)
          extras.push(`Certification: ${typeFields.certification_body}`);
        if (typeFields.at_trial_available) extras.push("Available at trial");
        break;
      case "vendor":
        if (typeFields.product_categories)
          extras.push(`Products: ${typeFields.product_categories}`);
        if (typeFields.online_shop_url)
          extras.push(`Shop: ${typeFields.online_shop_url}`);
        if (typeFields.demo_at_trial) extras.push("Demo available at trial");
        break;
      case "photographer":
        if (typeFields.portfolio_url)
          extras.push(`Portfolio: ${typeFields.portfolio_url}`);
        if (typeFields.packages_offered)
          extras.push(`Packages: ${typeFields.packages_offered}`);
        if (typeFields.deposit_required) extras.push("Deposit required");
        break;
    }

    if (extras.length > 0) {
      fullDescription = [fullDescription, ...extras].filter(Boolean).join("\n");
    }

    try {
      const res = await fetch("/api/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_type: core.provider_type,
          business_name: core.business_name,
          contact_name: core.contact_name,
          email: core.email,
          phone: core.phone || null,
          website_url: core.website_url || null,
          description: fullDescription || null,
          logo_url: logoUrl || null,
          location_city: core.location_city || null,
          location_province: core.location_province || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // If user already has a provider, redirect to dashboard
        if (res.status === 409 && data.provider_id) {
          onSuccess(data.provider_id);
          return;
        }
        throw new Error(data.error || "Failed to create provider");
      }

      onSuccess(data.provider.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s
                  ? "bg-blue-600 text-white"
                  : step > s
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              {step > s ? <Check className="h-4 w-4" /> : s}
            </div>
            {s < 3 && (
              <div
                className={`w-8 h-0.5 ${step > s ? "bg-green-300" : "bg-gray-200"}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Core fields */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provider Type *
            </label>
            <select
              value={core.provider_type}
              onChange={(e) => updateCore("provider_type", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a type...</option>
              {PROVIDER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={core.business_name}
                onChange={(e) => updateCore("business_name", e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your business or organization name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={core.contact_name}
                  onChange={(e) => updateCore("contact_name", e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Jane Smith"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={core.email}
                  onChange={(e) => updateCore("email", e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  value={core.phone}
                  onChange={(e) => updateCore("phone", e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="url"
                  value={core.website_url}
                  onChange={(e) => updateCore("website_url", e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City{" "}
                {(core.provider_type === "club" ||
                  core.provider_type === "facility" ||
                  core.provider_type === "body_worker") &&
                  "*"}
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={core.location_city}
                  onChange={(e) => updateCore("location_city", e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="City"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Province / State{" "}
                {(core.provider_type === "club" ||
                  core.provider_type === "facility") &&
                  "*"}
              </label>
              <input
                type="text"
                value={core.location_province}
                onChange={(e) => updateCore("location_province", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ON / CA"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={core.description}
              onChange={(e) => updateCore("description", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tell competitors about your services..."
            />
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!isStep1Valid()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next: Type Details
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Step 2: Type-specific fields */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {PROVIDER_TYPES.find((t) => t.value === core.provider_type)?.label} Details
          </h2>

          {core.provider_type === "club" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Affiliated Organization
                </label>
                <select
                  value={typeFields.affiliated_org}
                  onChange={(e) => updateType("affiliated_org", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  {ORGS.map((org) => (
                    <option key={org} value={org}>
                      {org}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Club Membership URL
                </label>
                <input
                  type="url"
                  value={typeFields.club_membership_url}
                  onChange={(e) => updateType("club_membership_url", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>
            </>
          )}

          {core.provider_type === "presenter" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Topics / Specialties
                </label>
                <input
                  type="text"
                  value={typeFields.topics}
                  onChange={(e) => updateType("topics", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Handling, Course Analysis, Puppy Foundation..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credentials / Titles
                </label>
                <input
                  type="text"
                  value={typeFields.credentials}
                  onChange={(e) => updateType("credentials", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="MACH, ADCH, World Team..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Booking Link
                </label>
                <input
                  type="url"
                  value={typeFields.booking_link}
                  onChange={(e) => updateType("booking_link", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>
            </>
          )}

          {core.provider_type === "facility" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Disciplines Offered
                </label>
                <input
                  type="text"
                  value={typeFields.disciplines}
                  onChange={(e) => updateType("disciplines", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Agility, Rally, Flyball..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Facility Type
                </label>
                <select
                  value={typeFields.facility_type}
                  onChange={(e) => updateType("facility_type", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  {FACILITY_TYPES.map((ft) => (
                    <option key={ft} value={ft}>
                      {ft}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Schedule URL
                </label>
                <input
                  type="url"
                  value={typeFields.class_schedule_url}
                  onChange={(e) => updateType("class_schedule_url", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>
            </>
          )}

          {core.provider_type === "body_worker" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modalities
                </label>
                <div className="flex flex-wrap gap-2">
                  {MODALITIES.map((mod) => (
                    <label
                      key={mod}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                        typeFields.modalities.includes(mod)
                          ? "bg-orange-100 text-orange-700 border border-orange-300"
                          : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={typeFields.modalities.includes(mod)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateType("modalities", [...typeFields.modalities, mod]);
                          } else {
                            updateType(
                              "modalities",
                              typeFields.modalities.filter((m) => m !== mod)
                            );
                          }
                        }}
                      />
                      {mod}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Certification Body
                </label>
                <input
                  type="text"
                  value={typeFields.certification_body}
                  onChange={(e) => updateType("certification_body", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. NBCAAM, IVCA..."
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={typeFields.at_trial_available}
                  onChange={(e) => updateType("at_trial_available", e.target.checked)}
                  className="rounded border-gray-300"
                />
                Available for at-trial appointments
              </label>
            </>
          )}

          {core.provider_type === "vendor" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand / Product Categories
                </label>
                <input
                  type="text"
                  value={typeFields.product_categories}
                  onChange={(e) => updateType("product_categories", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Leashes, Jumps, Treats..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Online Shop URL
                </label>
                <input
                  type="url"
                  value={typeFields.online_shop_url}
                  onChange={(e) => updateType("online_shop_url", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={typeFields.demo_at_trial}
                  onChange={(e) => updateType("demo_at_trial", e.target.checked)}
                  className="rounded border-gray-300"
                />
                Demo available at trial
              </label>
            </>
          )}

          {core.provider_type === "photographer" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Portfolio URL
                </label>
                <input
                  type="url"
                  value={typeFields.portfolio_url}
                  onChange={(e) => updateType("portfolio_url", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Packages Offered
                </label>
                <textarea
                  value={typeFields.packages_offered}
                  onChange={(e) => updateType("packages_offered", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your packages..."
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={typeFields.deposit_required}
                  onChange={(e) => updateType("deposit_required", e.target.checked)}
                  className="rounded border-gray-300"
                />
                Deposit required
              </label>
            </>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Next: Review
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Logo + Review + Submit */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Review &amp; Submit</h2>

          {/* Logo URL (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logo URL (optional)
            </label>
            <div className="relative">
              <Upload className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://your-logo-url.com/logo.png"
              />
            </div>
            {logoUrl && (
              <div className="mt-2 flex items-center gap-3">
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="w-12 h-12 rounded-full object-cover border border-gray-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <span className="text-xs text-gray-500">Preview</span>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Type</span>
              <span className="font-medium text-gray-900">
                {PROVIDER_TYPES.find((t) => t.value === core.provider_type)?.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Business</span>
              <span className="font-medium text-gray-900">{core.business_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Contact</span>
              <span className="font-medium text-gray-900">{core.contact_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-gray-900">{core.email}</span>
            </div>
            {core.phone && (
              <div className="flex justify-between">
                <span className="text-gray-500">Phone</span>
                <span className="font-medium text-gray-900">{core.phone}</span>
              </div>
            )}
            {core.location_city && (
              <div className="flex justify-between">
                <span className="text-gray-500">Location</span>
                <span className="font-medium text-gray-900">
                  {core.location_city}
                  {core.location_province ? `, ${core.location_province}` : ""}
                </span>
              </div>
            )}
            {core.website_url && (
              <div className="flex justify-between">
                <span className="text-gray-500">Website</span>
                <span className="font-medium text-blue-600 truncate max-w-[200px]">
                  {core.website_url}
                </span>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Create Profile
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
