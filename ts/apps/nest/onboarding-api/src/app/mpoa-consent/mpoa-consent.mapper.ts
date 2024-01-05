import {
  CreateMpoaConsent,
  UpdateMpoaConsent,
  MpoaConsent,
  StationCreateMpoaConsent,
  StationUpdateMpoaConsent,
  StationMpoaConsent,
} from '@*company-data-covered*/consumer-web-types';

const StationMpoaConsentToMpoaConsent = (
  input: StationMpoaConsent
): MpoaConsent => {
  const output: MpoaConsent = {
    careRequestId: input.care_request_id,
    consented: input.consented,
    powerOfAttorneyId: input.power_of_attorney_id,
    timeOfConsentChange: input.time_of_consent_change,
    userId: input.user_id,
    id: input.id,
  };

  return output;
};

const CreateMpoaConsentToStationCreateMpoaConsent = (
  input: CreateMpoaConsent,
  careRequestId: number
): StationCreateMpoaConsent => {
  const output: StationCreateMpoaConsent = {
    power_of_attorney_id: input.powerOfAttorneyId,
    time_of_consent_change: input.timeOfConsentChange,
    care_request_id: careRequestId,
    consented: input.consented,
  };

  return output;
};

const UpdateMpoaConsentToStationCreateMpoaConsent = (
  input: UpdateMpoaConsent
): StationUpdateMpoaConsent => {
  const output: StationUpdateMpoaConsent = {
    power_of_attorney_id: input.powerOfAttorneyId,
    time_of_consent_change: input.timeOfConsentChange,
    consented: input.consented,
  };

  return output;
};

export default {
  StationMpoaConsentToMpoaConsent,
  CreateMpoaConsentToStationCreateMpoaConsent,
  UpdateMpoaConsentToStationCreateMpoaConsent,
};
