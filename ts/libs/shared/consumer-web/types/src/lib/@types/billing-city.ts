export interface StationBillingCityPlaceOfService {
  id: number;
  place_of_service: string;
  active: boolean;
  billing_city_id: number;
  athena_department_id?: string;
  instamed_terminal_id?: string;
}

export interface BillingCityPlaceOfService {
  id: number;
  placeOfService: string;
  active: boolean;
  billingCityId: number;
  athenaDepartmentId?: string;
  instamedTerminalId?: string;
}

export interface StationBillingCity {
  id: number;
  name: string;
  short_name: string;
  state: string;
  enabled: boolean;
  provider_group_name: string;
  latitude: string | number;
  longitude: string | number;
  primary_insurance_search_enabled: true;
  default_department: string;
  usual_provider: string;
  tz_name: string;
  tz_short_name: string;
  display_insurance_note: boolean;
  insurance_note: string;
  market_id: number;
  created_at: string;
  updated_at: string;
  merchant_id: string;
}

export interface BillingCity {
  id?: number;
  name?: string;
  shortName?: string;
  state?: string;
  enabled?: boolean;
  providerGroupName?: string;
  latitude?: string | number;
  longitude?: string | number;
  primaryInsuranceSearchEnabled?: boolean;
  defaultDepartment?: string;
  usualProvider?: string;
  tzName?: string;
  tzShortName?: string;
  displayInsuranceNote?: boolean;
  insuranceNote?: string;
  marketId?: number;
  createdAt?: string;
  updatedAt?: string;
  merchantId?: string;
}
