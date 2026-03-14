import { Globe, Phone, Mail, User, BadgeCheck } from "lucide-react";
import type { ProviderWithAssociation } from "@/types/services";
import { AttendingBadge } from "./attending-badge";

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  club:         { label: "Club",          color: "bg-blue-500/15 text-blue-400 border border-blue-500/25" },
  presenter:    { label: "Presenter",     color: "bg-purple-500/15 text-purple-400 border border-purple-500/25" },
  facility:     { label: "Facility",      color: "bg-green-500/15 text-green-400 border border-green-500/25" },
  body_worker:  { label: "Body Worker",   color: "bg-orange-500/15 text-orange-400 border border-orange-500/25" },
  vendor:       { label: "Vendor",        color: "bg-pink-500/15 text-pink-400 border border-pink-500/25" },
  photographer: { label: "Photographer",  color: "bg-teal-500/15 text-teal-400 border border-teal-500/25" },
  vet:          { label: "Veterinarian",  color: "bg-red-500/15 text-red-400 border border-red-500/25" },
};

interface ProviderCardProps {
  provider: ProviderWithAssociation;
}

export function ProviderCard({ provider }: ProviderCardProps) {
  const typeInfo = TYPE_LABELS[provider.provider_type] || {
    label: provider.provider_type,
    color: "bg-[var(--surface-3)] text-[var(--muted-text)] border border-[var(--border)]",
  };

  const truncatedDescription =
    provider.description && provider.description.length > 120
      ? provider.description.slice(0, 120) + "..."
      : provider.description;

  return (
    <div className="flex gap-3 p-3 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
      {/* Logo / fallback avatar */}
      <div className="flex-shrink-0">
        {provider.logo_url ? (
          <img
            src={provider.logo_url}
            alt={provider.business_name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] flex items-center justify-center">
            <User className="h-5 w-5 text-[var(--muted-text)]" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-sm font-semibold text-[var(--cream)] truncate">
            {provider.business_name}
          </span>
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${typeInfo.color}`}
          >
            {typeInfo.label}
          </span>
          {provider.is_verified && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-blue-400">
              <BadgeCheck className="h-3 w-3" />
              Verified
            </span>
          )}
          {provider.is_attending && <AttendingBadge />}
        </div>

        {truncatedDescription && (
          <p className="text-xs text-[var(--muted-text)] mb-2">{truncatedDescription}</p>
        )}

        {/* Action links */}
        <div className="flex items-center gap-3 flex-wrap">
          {provider.website_url && (
            <a
              href={provider.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[var(--agili-accent)] hover:brightness-90 font-medium"
            >
              <Globe className="h-3 w-3" />
              Website
            </a>
          )}
          {provider.phone && (
            <a
              href={`tel:${provider.phone}`}
              className="inline-flex items-center gap-1 text-xs text-[var(--muted-text)] hover:text-[var(--cream)]"
            >
              <Phone className="h-3 w-3" />
              {provider.phone}
            </a>
          )}
          {provider.email && (
            <a
              href={`mailto:${provider.email}`}
              className="inline-flex items-center gap-1 text-xs text-[var(--muted-text)] hover:text-[var(--cream)]"
            >
              <Mail className="h-3 w-3" />
              {provider.email}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
