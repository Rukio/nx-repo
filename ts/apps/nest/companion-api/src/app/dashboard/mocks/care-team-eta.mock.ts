import { EtaPrecision } from '../../care-request/enums/care-request-eta-precision';
import { CareTeamEta } from '../types/care-team-eta';

export const buildMockCareTeamEta = (
  userDefinedValues: Partial<CareTeamEta> = {}
): CareTeamEta => {
  return {
    estimatedArrivalTimestampSec: 1667835525,
    precision: EtaPrecision['PRECISION_UNSPECIFIED'],
    ...userDefinedValues,
  };
};
