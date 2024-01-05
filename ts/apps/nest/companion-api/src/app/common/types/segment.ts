import { TrackParams as SegmentTrackParams } from '@segment/analytics-node';
import { COMPANION_SEGMENT_EVENTS } from '../constants';
import { ConsentType } from '../../consents/dto/consent.dto';
import { SignerRelationToPatient } from '../../consents/dto/signature.dto';

/*
 * TODO: Figure out 'properties' prop: https://*company-data-covered*.atlassian.net/browse/PT-1653
 *
 * Issue: SegmentTrackParams contains a 'properties' type, which causes 'CompanionSegmentEventTrackParams'
 * to allow any value of any type inside its own 'properties' type, if it is not explicitly added as a 'EventsProperties'
 * 'properties' key.
 * Using Omit<SegmentTrackParams, 'properties'> to force its implementation on each member of 'EventsProperties' results
 * in a constraint violation of <P extends TrackParams> (from `SegmentService.track`), even if each member of the union
 * does have it explicitely defined.
 */
export type CompanionSegmentEventTrackParams = SegmentTrackParams &
  EventsProperties;

type EventsProperties =
  | AuthenticationFailed
  | AuthenticationSuccess
  | ConsentAppliedFailed
  | ConsentAppliedSuccess
  | DriverLicenseUploadFailed
  | DriverLicenseUploadSuccess
  | InsuranceUploadFailed
  | InsuranceUploadSuccess
  | LinkCreated
  | LinkExpired
  | LinkNotFound
  | ServerError
  | SetDefaultPharmacyFailed
  | SetDefaultPharmacySuccess
  | SetPCPFailed
  | SetPCPSuccess
  | SMSSent
  | UploadPatientSocialHistoryFailed
  | UploadPatientSocialHistorySuccess;

type AuthenticationFailed = {
  event: COMPANION_SEGMENT_EVENTS.AUTHENTICATION_FAILED;
  properties: PropertiesWithCareRequestId;
};

type AuthenticationSuccess = {
  event: COMPANION_SEGMENT_EVENTS.AUTHENTICATION_SUCCESS;
  properties: PropertiesWithCareRequestId;
};

export type ConsentAppliedCommonProperties = PropertiesWithCareRequestId<{
  consentType: ConsentType;
  signedAt: string;
  signerName: string;
  signerRelationToPatient: SignerRelationToPatient;
}>;

type ConsentAppliedFailed = {
  event: COMPANION_SEGMENT_EVENTS.CONSENT_APPLIED_FAILED;
  properties: ConsentAppliedCommonProperties & Error;
};

type ConsentAppliedSuccess = {
  event: COMPANION_SEGMENT_EVENTS.CONSENT_APPLIED_SUCCESS;
  properties: ConsentAppliedCommonProperties;
};

type DriverLicenseUploadFailed = {
  event: COMPANION_SEGMENT_EVENTS.DRIVER_LICENSE_UPLOAD_FAILED;
  properties: PropertiesWithCareRequestId & Error;
};

type DriverLicenseUploadSuccess = {
  event: COMPANION_SEGMENT_EVENTS.DRIVER_LICENSE_UPLOAD_SUCCESS;
  properties: PropertiesWithCareRequestId;
};

type InsuranceUploadFailed = {
  event: COMPANION_SEGMENT_EVENTS.INSURANCE_UPLOAD_FAILED;
  properties: PropertiesWithCareRequestId & Error;
};

type InsuranceUploadSuccess = {
  event: COMPANION_SEGMENT_EVENTS.INSURANCE_UPLOAD_SUCCESS;
  properties: PropertiesWithCareRequestId;
};

type LinkCreated = {
  event: COMPANION_SEGMENT_EVENTS.LINK_CREATED;
  properties: PropertiesWithCareRequestId;
};

type LinkExpired = {
  event: COMPANION_SEGMENT_EVENTS.LINK_EXPIRED;
  properties: PropertiesWithCareRequestId<{
    careRequestCompletedDate?: string;
    careRequestArchivedDate?: string;
    companionLinkCreationDate: string;
  }>;
};

type LinkNotFound = {
  event: COMPANION_SEGMENT_EVENTS.LINK_NOTFOUND;
  properties?: never;
};

type ServerError = {
  event: COMPANION_SEGMENT_EVENTS.SERVER_ERROR;
  properties: {
    path: string;
  } & Error;
};

type SetDefaultPharmacyFailed = {
  event: COMPANION_SEGMENT_EVENTS.SET_DEFAULT_PHARMACY_FAILED;
  properties: PropertiesWithCareRequestId & Error;
};

type SetDefaultPharmacySuccess = {
  event: COMPANION_SEGMENT_EVENTS.SET_DEFAULT_PHARMACY_SUCCESS;
  properties: PropertiesWithCareRequestId;
};

type SetPCPFailed = {
  event: COMPANION_SEGMENT_EVENTS.SET_PCP_FAILED;
  properties: PropertiesWithCareRequestId & Error;
};

type SetPCPSuccess = {
  event: COMPANION_SEGMENT_EVENTS.SET_PCP_SUCCESS;
  properties: PropertiesWithCareRequestId;
};

type SMSSent = {
  event: COMPANION_SEGMENT_EVENTS.SMS_SENT;
  properties: PropertiesWithCareRequestId<{
    trigger: string;
  }>;
};

type UploadPatientSocialHistoryFailed = {
  event: COMPANION_SEGMENT_EVENTS.UPDATE_PATIENT_SOCIAL_HISTORY_FAILED;
  properties: PropertiesWithCareRequestId & Error;
};

type UploadPatientSocialHistorySuccess = {
  event: COMPANION_SEGMENT_EVENTS.UPDATE_PATIENT_SOCIAL_HISTORY_SUCCESS;
  properties: PropertiesWithCareRequestId<{
    questionTag: string;
    questionKey: string;
  }>;
};

type PropertiesWithCareRequestId<P = unknown> = P & { careRequestId: number };

type Error = {
  errorName?: string;
  errorMessage?: string;
};
