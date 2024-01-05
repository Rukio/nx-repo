import {
  StationMpoaConsent,
  MpoaConsent,
} from '@*company-data-covered*/consumer-web-types';

const time = new Date();

export const mockMpoaConsent: MpoaConsent = {
  careRequestId: 1,
  consented: true,
  powerOfAttorneyId: 90380,
  timeOfConsentChange: time,
  userId: 84949,
  id: 2,
};

export const mockStationMpoaConsent: StationMpoaConsent = {
  care_request_id: 1,
  consented: true,
  id: 2,
  power_of_attorney_id: 90380,
  time_of_consent_change: time,
  user_id: 84949,
  created_at: undefined,
  updated_at: undefined,
};
