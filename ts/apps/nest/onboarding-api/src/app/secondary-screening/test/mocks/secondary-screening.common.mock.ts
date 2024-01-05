import {
  SecondaryScreening,
  StationSecondaryScreening,
} from '@*company-data-covered*/consumer-web-types';

export const SECONDARY_SCREENING_MOCK: SecondaryScreening = {
  id: 1234,
  careRequestId: 3464,
  providerId: 77015,
  approvalStatus: 'approved',
  note: 'Some comment',
  createdAt: '2022-07-19T15:00:00.000Z',
  updatedAt: '2022-07-20T03:00:00.000Z',
  telepresentationEligible: true,
  mustBeSeenToday: true,
};

export const SECONDARY_SCREENING_PARAMS_MOCK = {
  approvalStatus: 'approved',
  note: 'Some comment',
  providerId: 77015,
  mustBeSeenToday: true,
  telepresentationEligible: true,
};

export const STATION_SECONDARY_SCREENING_MOCK: StationSecondaryScreening = {
  id: 1234,
  care_request_id: 3464,
  provider_id: 77015,
  approval_status: 'approved',
  note: 'Some comment',
  created_at: '2022-07-19T15:00:00.000Z',
  updated_at: '2022-07-20T03:00:00.000Z',
  telepresentation_eligible: true,
  must_be_seen_today: true,
};
