import {
  SecondaryScreening,
  StationSecondaryScreening,
} from '@*company-data-covered*/consumer-web-types';
import InputNotSpecifiedException from '../common/exceptions/input-not-specified.exception';

const StationSecondaryScreeningToSecondaryScreening = (
  input: StationSecondaryScreening
): SecondaryScreening => {
  if (!input) {
    throw new InputNotSpecifiedException(
      StationSecondaryScreeningToSecondaryScreening.name
    );
  }
  const output: SecondaryScreening = {
    id: input.id,
    careRequestId: input.care_request_id,
    providerId: input.provider_id,
    approvalStatus: input.approval_status,
    note: input.note,
    mustBeSeenToday: input.must_be_seen_today,
    telepresentationEligible: input.telepresentation_eligible,
    createdAt: input.created_at,
    updatedAt: input.updated_at,
  };

  return output;
};

const SecondaryScreeningToStationSecondaryScreening = (
  input: Partial<SecondaryScreening>
): StationSecondaryScreening => {
  if (!input) {
    throw new InputNotSpecifiedException(
      SecondaryScreeningToStationSecondaryScreening.name
    );
  }
  const output: StationSecondaryScreening = {
    id: input.id,
    care_request_id: input.careRequestId,
    provider_id: input.providerId,
    approval_status: input.approvalStatus,
    note: input.note,
    must_be_seen_today: input.mustBeSeenToday,
    telepresentation_eligible: input.telepresentationEligible,
    created_at: input.createdAt,
    updated_at: input.updatedAt,
  };

  return output;
};

export default {
  StationSecondaryScreeningToSecondaryScreening,
  SecondaryScreeningToStationSecondaryScreening,
};
