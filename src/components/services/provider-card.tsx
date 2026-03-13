import { Globe, Phone, Mail, User, BadgeCheck } from "lucide-react";
import type { ProviderWithAssociation } from "@/types/services";
import { AttendingBadge } from "./attending-badge";

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  club: { label: "Club", color: "bg-blue-100 text-blue-700" },
  presenter: { label: "Presenter", color: "bg-purple-100 text-purple-700" },
  facility: { label: "Facility", color: "bg-green-100 text-green-700" },
  body_worker: { label: "Body Worker", color: "bg-orange-100 text-orange-700" },
  vendor: { label: "Vendor", color: "bg-pink-100 text-pink-700" },
  photographer: { label: "Photographer", color: "bg-teal-100 text-teal-700" },
  vet: { label: "Veterinarian", color: "bg-red-100 text-red-700" },
};

interface ProviderCardProps {
  provider: ProviderWithAssociation;
}

export function ProviderCard({ provider }: ProviderCardProps) {
  const typeInfo = TYPE_LABELS[provider.provider_type] || {
    label: provider.provider_type,
    color: "bg-gray-100 text-gray-700",
  };

  const truncatedDescription =
    provider.description && provider.description.length > 120
      ? provider.description.slice(0, 120) + "..."
      : provider.description;

  return (
    <div className="flex gap-3 p-3 bg-white rounded-lg border border-gray-200">
      {/* Logo / fallback avatar */}
      <div className="flex-shrink-0">
        {provider.logo_url ? (
          <img
            src={provider.logo_url}
            alt={provider.business_name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <User className="h-5 w-5 text-gray-400" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-sm font-semibold text-gray-900 truncate">
            {provider.business_name}
          </span>
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${typeInfo.color}`}
          >
            {typeInfo.label}
          </span>
          {provider.is_verified && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-blue-700">
              <BadgeCheck className="h-3 w-3" />
              Verified
            </span>
          )}
          {provider.is_attending && <AttendingBadge />}
        </div>

        {truncatedDescription && (
          <p className="text-xs text-gray-600 mb-2">{truncatedDescription}</p>
        )}

        {/* Action links */}
        <div className="flex items-center gap-3 flex-wrap">
          {provider.website_url && (
            <a
              href={provider.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              <Globe className="h-3 w-3" />
              Website
            </a>
          )}
          {provider.phone && (
            <a
              href={`tel:${provider.phone}`}
              className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800"
            >
              <Phone className="h-3 w-3" />
              {provider.phone}
            </a>
          )}
          {provider.email && (
            <a
              href={`mailto:${provider.email}`}
              className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800"
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
