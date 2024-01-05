import { OffboardReason } from '../../types';

export const DISMISSED_PATIENT_OFFBOARD_COMMENT =
  'Patient Demographics: Patient has been dismissed from our service';

export const ACUITY_SEGMENTATION_OFFBOARD_COMMENT =
  'Insurance: Full-Capacity Off-Board Message Was Presented';

export const MARKET_FULLY_BOOKED_OFFBOARD_COMMENT =
  'Location and Assignment: Cannot Confirm A Time Window';

export const getOffboardReasonAndComment = ({
  isDismissedPatient,
  isAcuitySegmentationEnabled,
}: {
  isDismissedPatient: boolean;
  isAcuitySegmentationEnabled: boolean;
}) => {
  if (isDismissedPatient) {
    return {
      reason: OffboardReason.DismissedPatient,
      comment: DISMISSED_PATIENT_OFFBOARD_COMMENT,
    };
  }
  if (isAcuitySegmentationEnabled) {
    return {
      reason: OffboardReason.AcuitySegmentation,
      comment: ACUITY_SEGMENTATION_OFFBOARD_COMMENT,
    };
  }

  return {
    reason: OffboardReason.FullyBooked,
    comment: MARKET_FULLY_BOOKED_OFFBOARD_COMMENT,
  };
};
