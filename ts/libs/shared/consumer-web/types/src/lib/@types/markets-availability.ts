export interface MarketsAvailabilityZipcode {
  id: number;
  marketId: number;
  billingCityId: number;
  marketShortName?: string;
}

export interface StationMarketsAvailabilityZipcode {
  id: number;
  market_id: number;
  billing_city_id: number;
}

export interface MarketsAvailability {
  id: number;
  name: string;
  state: string;
  shortName: string;
  enabled: boolean;
  only911: boolean;
  primaryInsuranceSearchEnabled: boolean;
  tzName?: string;
  tzShortName?: string;
  stateLocale?: StateLocale;
}

export interface ScreenerLine {
  id: number;
  phoneNumber: string;
  genesysId: string;
  queueName: string;
}

export interface StationScreenerLine {
  id: number;
  phone_number: string;
  genesys_id: string;
  queue_name: string;
}

export interface StateLocale {
  id: number;
  name: string;
  abbreviation: string;
  screenerLine?: ScreenerLine;
}

export interface StationStateLocale {
  id: number;
  name: string;
  abbreviation: string;
  screener_line?: StationScreenerLine;
}

export interface StationMarketsAvailability {
  id: number;
  name: string;
  state: string;
  short_name: string;
  enabled: boolean;
  only_911: boolean;
  primary_insurance_search_enabled: boolean;
  tz_name?: string;
  tz_short_name?: string;
  state_locale?: StationStateLocale;
}

export interface CheckMarketAvailability {
  availability: string;
}

export interface CheckMarketAvailabilityBody {
  zipcode?: string;
  marketId?: number;
  date?: string;
  latitude?: number;
  longitude?: number;
  startTimeSec?: number;
  endTimeSec?: number;
  careRequestId?: number;
  serviceLineId?: number;
}

export interface StationCheckMarketAvailabilityBody {
  zipcode?: string;
  market_id?: number;
  date?: string;
  latitude?: number;
  longitude?: number;
  start_timestamp_sec?: number;
  end_timestamp_sec?: number;
  care_request_id?: number;
  service_line_id?: number;
}

export type MarketAvailabilityStatus =
  | 'available'
  | 'limited_availability'
  | 'unavailable';

export interface MarketAvailability {
  availability: MarketAvailabilityStatus;
}

export interface MarketAvailabilities {
  availabilities: MarketAvailability[];
}

export interface StationMarketAvailabilityBody {
  market_id: number;
  service_date: string;
  requested_service_line: string;
}
export interface MarketAvailabilityBody {
  market_id: number;
  service_date: string;
  requested_service_line: string;
}
