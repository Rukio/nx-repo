export interface StationMpoaConsent {
  id: number;
  consented: boolean;
  power_of_attorney_id: number;
  time_of_consent_change: Date;
  care_request_id: number;
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface StationCreateMpoaConsent {
  care_request_id: number;
  consented: boolean;
  power_of_attorney_id: number;
  time_of_consent_change: Date;
}

export interface StationUpdateMpoaConsent {
  care_request_id?: number;
  consented: boolean;
  power_of_attorney_id?: number;
  time_of_consent_change?: Date;
}
