export type MarketLogisticsOptions = {
  service_area_type: string;
  eta_range_window_hours: string;
  allow_eta_range_modification: boolean;
  early_forgiveness_threshold: string;
  late_forgiveness_threshold: string;
  enable_next_day_eta: boolean;
};

export type MarketImage = {
  url: string | null;
  scaled: {
    url: string | null;
  };
};

export type MarketSchedule = {
  id: number;
  open_at: string;
  close_at: string;
  open_duration: number;
  days: string[];
  created_at: string;
  updated_at: string;
  schedulable_type: string;
  schedulable_id: number;
};

export interface MarketStateLocale {
  id: number;
  name: string;
  abbreviation: string;
  screener_line?: {
    id: number;
    phone_number: string;
    genesys_id: string;
    queue_name: string;
  };
}

export type Market = {
  id: number;
  name: string;
  state: string;
  short_name: string;
  only_911: boolean;
  primary_insurance_search_enabled: boolean;
  self_pay_rate: number;
  auto_assignable: boolean;
  tz_name: string;
  tz_short_name: string;
  zipcode: string | null;
  old_open_at: string | null;
  old_close_at: string | null;
  created_at: string;
  updated_at: string;
  old_open_duration: string | null;
  sa_time_zone: string;
  enabled: boolean;
  provider_group_name: string;
  latitude: number;
  longitude: number;
  humanity_id: string;
  hie_url_string: string;
  congestion_threshold: number | null;
  service_area_radius: number | null;
  too_far_threshold: number | null;
  logistics_options: MarketLogisticsOptions;
  display_insurance_note: boolean;
  insurance_note: string;
  followup_percentage: number;
  enable_breaks: boolean;
  geocode_provider: string | null;
  return_time_offset: number | null;
  onboarding_cc_capture: boolean;
  npi: string | null;
  chronic_care_notification: boolean;
  market_image: MarketImage;
  service_area_image: MarketImage;
  market_name: string;
  timezone: string;
  contact_email: string;
  'capacity_managed?': boolean;
  allow_eta_range_modification: boolean | null;
  auto_assign_type_or_default: string;
  next_day_eta_enabled: boolean;
  schedules: MarketSchedule[];
  genesys_id?: string;
  state_locale?: MarketStateLocale;
};
