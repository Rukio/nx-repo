import {
  ProviderProfileLicense,
  StationProviderProfileLicense,
} from './provider';

export interface StationCar {
  id?: number;
  created_at?: string;
  updated_at?: string;
  name: string;
  market_id: number;
  latitude?: string;
  longitude?: string;
  last_location_id?: number;
  base_location_id?: number;
  auto_assignable?: boolean;
  secondary_screening_priority: boolean;
  virtual_visit?: boolean;
  nine_one_one_vehicle?: boolean;
  phone?: string;
  status?: string;
}

export interface Car {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  name: string;
  marketId: number;
  latitude?: string;
  longitude?: string;
  lastLocationId?: number;
  baseLocationId?: number;
  autoAssignable?: boolean;
  secondaryScreeningPriority: boolean;
  virtualVisit?: boolean;
  nineOneOneVehicle?: boolean;
  phone?: string;
  status?: string;
}

export interface StationShiftTeamType {
  id?: number;
  name?: string;
  label?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ShiftTeamType {
  id?: number;
  name?: string;
  label?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StationShiftTeamMember {
  id?: number;
  first_name?: string;
  last_name?: string;
  mobile_number?: string;
  provider_image_tiny_url?: string;
  provider_profile_position?: string;
  provider_profile_licenses?: StationProviderProfileLicense[];
  provider_profile_credentials?: string;
  secondary_screening_states?: string[];
}

export interface AssignableShiftTeamAttributes {
  id?: number;
  name: string;
}

export interface StationGeneralAssignableShiftTeam {
  shift_team: StationAssignableShiftTeam;
  status?: string;
  time_window_status?: string;
  missing_required_attributes?: AssignableShiftTeamAttributes[];
  missing_preferred_attributes?: AssignableShiftTeamAttributes[];
  included_forbidden_attributes?: AssignableShiftTeamAttributes[];
  included_unwanted_attributes?: AssignableShiftTeamAttributes[];
}

export interface StationAssignableShiftTeams {
  shift_teams?: StationGeneralAssignableShiftTeam[];
}

export interface StationAssignableShiftTeam {
  id: number;
  available_time_window: {
    start_date_time: Date | string;
    end_date_time: Date | string;
  };
  car_name?: string;
  attributes?: AssignableShiftTeamAttributes[];
}

export interface ShiftTeamMember {
  id?: number;
  firstName?: string;
  lastName?: string;
  mobileNumber?: string;
  providerImageTinyUrl?: string;
  providerProfilePosition?: string;
  providerProfileLicenses?: ProviderProfileLicense[];
  providerProfileCredentials?: string;
  secondaryScreeningStates?: string[];
}

export interface StationShiftTeam {
  id?: number;
  car_id: number;
  market_id: number;
  created_at?: string;
  updated_at?: string;
  start_time: string;
  end_time: string;
  route_poly?: string;
  en_route_poly?: string;
  rendering_provider_type?: string;
  skill_ids?: number[];
  shift_type_id?: number;
  presentation_modality?: string;
  car?: StationCar;
  shift_type?: StationShiftTeamType;
  members?: StationShiftTeamMember[];
  tz_short_name?: string;
  shift_start_date?: string;
  status?: string;
}

export interface ShiftTeam {
  id?: number;
  carId: number;
  marketId: number;
  createdAt?: string;
  updatedAt?: string;
  startTime: string;
  endTime: string;
  routePoly?: string;
  enRoutePoly?: string;
  renderingProviderType?: string;
  skillIds?: number[];
  shiftTypeId?: number;
  presentationModality?: string;
  car?: Car;
  shiftType?: ShiftTeamType;
  members?: ShiftTeamMember[];
  tzShortName?: string;
  shiftStartDate?: string;
  status?: string;
}

export interface AssignableShiftTeam {
  id: number;
  startTime: string;
  endTime: string;
  skillId?: number[];
  license?: string[];
  insurance?: string[];
  presentationModality?: string;
  assignmentType?: string;
  status?: string;
  timeWindowStatus?: string;
  carName?: string;
  shiftType?: string;
  missingRequiredAttributes?: AssignableShiftTeamAttributes[];
  missingPreferredAttributes?: AssignableShiftTeamAttributes[];
  includedForbiddenAttributes?: AssignableShiftTeamAttributes[];
  includedUnwantedAttributes?: AssignableShiftTeamAttributes[];
}
