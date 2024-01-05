export enum AddressStatus {
  UNSPECIFIED = 'unspecified',
  VALID = 'valid',
  CONFIRM = 'needs_confirmation',
  INVALID = 'invalid',
}

export enum FacilityType {
  FACILITY_TYPE_UNSPECIFIED = 0,
  FACILITY_TYPE_HOME = 1,
  FACILITY_TYPE_WORK = 2,
  FACILITY_TYPE_INDEPENDENT_LIVING_FACILITY = 3,
  FACILITY_TYPE_ASSISTED_LIVING_FACILITY = 4,
  FACILITY_TYPE_SKILLED_NURSING_FACILITY = 5,
  FACILITY_TYPE_CLINIC = 6,
  FACILITY_TYPE_LONG_TERM_CARE_FACILITY = 7,
  FACILITY_TYPE_REHABILITATION_FACILITY = 8,
  FACILITY_TYPE_VIRTUAL_VISIT = 9,
  FACILITY_TYPE_SENIOR_LIVING_TESTING = 10,
  FACILITY_TYPE_SCHOOL = 11,
  FACILITY_TYPE_HOTEL = 12,
  UNRECOGNIZED = -1,
}

export interface Address {
  id?: number;
  country?: string;
  city: string;
  state: string;
  zip: string;
  streetAddress1: string;
  streetAddress2: string;
  additionalDetails?: string;
  latitude?: string | number;
  longitude?: string | number;
  accountId?: number;
  consistencyToken?: Uint8Array | string;
  googleValidationResponseId?: string;
}

export interface OssAddress extends Address {
  facilityType: FacilityType;
}

export interface SuggestedAddress extends Address {
  valid: boolean;
  reasons: string[];
}

export interface AccountAddress {
  address?: Address;
  suggestedAddress?: SuggestedAddress;
  consistencyToken?: Uint8Array | string;
  accountId?: number;
  status?: AddressStatus;
}

// TODO [ON-1170] Remake interface to use AccountAddress with OssAddress
export interface OssAccountAddress extends AccountAddress {
  address?: OssAddress;
}
