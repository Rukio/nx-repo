import { CareRequestParams } from '@*company-data-covered*/consumer-web-types';

export type RequestAddress = CareRequestParams['address'];

export type RequestComplaint = CareRequestParams['complaint'];

export type RequestPatient = CareRequestParams['patient'];

export type RequestCaller = CareRequestParams['caller'];

export enum RelationshipToPatient {
  familyFriend = 'family:friend',
  clinicianOrganization = 'clinician',
  other = 'other',
  myself = 'patient',
  else = 'else',
}

export type RequestState = Omit<CareRequestParams, 'token' | 'type'>;
