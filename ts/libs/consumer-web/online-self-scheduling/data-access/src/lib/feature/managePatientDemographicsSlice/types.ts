import {
  DomainMarketsAvailabilityZipCode,
  OnlineSelfSchedulingError,
} from '../../types';

export type ManagePatientDemographicsState = {
  isLoading: boolean;
  isError?: boolean;
  isSuccess?: boolean;
  error?: OnlineSelfSchedulingError;
};

export type UpdatePatientDemographicsPayload = {
  requesterFirstName?: string;
  requesterLastName?: string;
  requesterPhone?: string;
  patientFirstName?: string;
  patientLastName?: string;
  patientMiddleName?: string;
  patientPhone?: string;
  patientSuffix?: string;
  birthday?: string;
  legalSex?: string;
  assignedSexAtBirth?: string;
  genderIdentity?: string;
  genderIdentityDetails?: string;
};

export type UpsertPatientPayload = {
  billingCityId?: DomainMarketsAvailabilityZipCode['billingCityId'];
};
