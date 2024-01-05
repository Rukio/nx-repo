import { StationCareRequestUnauthorized } from '@*company-data-covered*/consumer-web-types';

export type CreateUnauthenticatedCareRequestDataPayload =
  StationCareRequestUnauthorized;

export type UnauthenticatedCareRequestResult = {
  success: boolean;
  care_request_id: string;
};
