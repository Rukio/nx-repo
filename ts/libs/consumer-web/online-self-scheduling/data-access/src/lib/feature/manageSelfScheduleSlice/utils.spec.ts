import { OffboardReason } from '../../types';
import {
  ACUITY_SEGMENTATION_OFFBOARD_COMMENT,
  DISMISSED_PATIENT_OFFBOARD_COMMENT,
  getOffboardReasonAndComment,
  MARKET_FULLY_BOOKED_OFFBOARD_COMMENT,
} from './utils';

describe('getOffboardReasonAndComment', () => {
  it.each([
    {
      input: { isDismissedPatient: true, isAcuitySegmentationEnabled: false },
      expected: {
        reason: OffboardReason.DismissedPatient,
        comment: DISMISSED_PATIENT_OFFBOARD_COMMENT,
      },
    },
    {
      input: { isDismissedPatient: false, isAcuitySegmentationEnabled: true },
      expected: {
        reason: OffboardReason.AcuitySegmentation,
        comment: ACUITY_SEGMENTATION_OFFBOARD_COMMENT,
      },
    },
    {
      input: { isDismissedPatient: false, isAcuitySegmentationEnabled: false },
      expected: {
        reason: OffboardReason.FullyBooked,
        comment: MARKET_FULLY_BOOKED_OFFBOARD_COMMENT,
      },
    },
  ])('should return correct reason and comment', ({ input, expected }) => {
    const result = getOffboardReasonAndComment(input);
    expect(result).toStrictEqual(expected);
  });
});
