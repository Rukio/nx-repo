import { PatientPreferredEta } from '@*company-data-covered*/consumer-web-types';
import { SerializedError } from '@reduxjs/toolkit';
import {
  CreateCareRequestPayload,
  OffboardReason,
  SelfScheduleData,
} from '../../types';

export type ManageSelfScheduleState = {
  data?: SelfScheduleData;
  notificationJobId?: string;
  isLoading?: boolean;
  isError?: boolean;
  isSuccess?: boolean;
  error?: SerializedError;
  offboardReason?: OffboardReason;
};

export type CreateSelfSchedulingCareRequestPayload = {
  mpoaConsent: Required<
    Pick<CreateCareRequestPayload['mpoaConsent'], 'powerOfAttorneyId'>
  >;
  riskAssessment?: Required<
    Pick<
      NonNullable<CreateCareRequestPayload['riskAssessment']>,
      | 'dob'
      | 'gender'
      | 'worstCaseScore'
      | 'score'
      | 'protocolId'
      | 'protocolName'
      | 'responses'
      | 'overrideReason'
      | 'complaint'
    >
  >;
  careRequest: Required<
    Pick<
      CreateCareRequestPayload['careRequest'],
      | 'marketId'
      | 'patientId'
      | 'placeOfService'
      | 'requester'
      | 'address'
      | 'complaint'
      | 'channelItemId'
    >
  > & {
    patientPreferredEta?: Required<PatientPreferredEta>;
  };
};
