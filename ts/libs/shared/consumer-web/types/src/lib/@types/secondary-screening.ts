export interface SecondaryScreening {
  id: number;
  careRequestId?: number;
  providerId?: number;
  approvalStatus: string;
  note: string;
  createdAt?: string;
  updatedAt?: string;
  telepresentationEligible?: boolean;
  mustBeSeenToday?: boolean;
  provider?: {
    id: number;
    first_name: string;
    last_name: string;
    provider_image_tiny_url?: string;
    provider_profile_position?: string;
    provider_profile_credentials?: string;
  };
}
export interface StationSecondaryScreening {
  id?: number;
  care_request_id?: number;
  provider_id?: number;
  approval_status: string;
  note?: string;
  created_at?: string;
  updated_at?: string;
  provider_updated_at?: string;
  provider_updater_id?: number;
  note_updated_at?: string;
  note_updater_id?: number;
  telepresentation_eligible?: boolean;
  must_be_seen_today?: boolean;
  provider_updater?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  provider?: {
    id: number;
    first_name: string;
    last_name: string;
    provider_image_tiny_url?: string;
    provider_profile_position?: string;
    provider_profile_credentials?: string;
  };
}
