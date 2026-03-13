export interface ProviderData {
  id: string;
  provider_type: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  website_url: string | null;
  description: string | null;
  logo_url: string | null;
  location_city: string | null;
  location_province: string | null;
  service_radius_km: number | null;
  is_verified: boolean;
}

export interface TrialAssociation {
  id: string;
  trial_id: string;
  is_attending: boolean;
  association_note: string | null;
  created_at: string;
}

export interface ProviderWithAssociation {
  id: string;
  provider_type: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  website_url: string | null;
  description: string | null;
  logo_url: string | null;
  location_city: string | null;
  location_province: string | null;
  service_radius_km: number | null;
  is_verified: boolean;
  is_attending: boolean;
  association_note: string | null;
}

export interface PlaceCacheRow {
  id: string;
  category: string;
  place_id: string;
  name: string | null;
  address: string | null;
  phone: string | null;
  rating: number | null;
  maps_url: string | null;
  fetched_at: string;
}

export interface TrialServicesResponse {
  providers: {
    attending: ProviderWithAssociation[];
    associated: ProviderWithAssociation[];
  };
  nearby: {
    veterinarians: PlaceCacheRow[];
    pet_stores: PlaceCacheRow[];
    body_workers: PlaceCacheRow[];
    emergency_vets: PlaceCacheRow[];
  };
  places_cache_age_days: number | null;
}
