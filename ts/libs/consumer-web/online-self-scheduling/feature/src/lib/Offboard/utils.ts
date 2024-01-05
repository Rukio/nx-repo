import { OffboardReason } from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';

export const getOffboardData = (
  isRelationToPatientSelf: boolean,
  offboardReason?: OffboardReason
): {
  title: string;
  message: string;
} => {
  const patientPossessiveStartText = isRelationToPatientSelf ? 'Your' : 'Their';
  const patientPossessiveText = patientPossessiveStartText.toLowerCase();

  switch (offboardReason) {
    case OffboardReason.AcuitySegmentation:
      return {
        title: `We apologize, we don’t have an appropriate team available to care for ${
          isRelationToPatientSelf ? 'you' : 'the patient'
        } today.`,
        message: `We encourage you to call ${patientPossessiveText} primary care provider or seek care at a facility.`,
      };
    case OffboardReason.FullyBooked:
      return {
        title: 'We’re sorry, but we’re fully booked today and tomorrow.',
        message: `We encourage you to call ${patientPossessiveText} primary care provider or seek care at a facility.`,
      };
    case OffboardReason.DismissedPatient:
      return {
        title:
          'Your request for medical care from *company-data-covered* cannot be scheduled due to past encounters.',
        message: `As we will no longer furnish ${patientPossessiveText} care, you should find another servicer for ${patientPossessiveText} healthcare needs.\n\n${patientPossessiveStartText} medical records are available in the patient portal. If ${patientPossessiveText} new medical care provider has questions about ${patientPossessiveText} care with *company-data-covered*, upon ${patientPossessiveText} written authorization we will send them copies of ${patientPossessiveText} records. If ${patientPossessiveText} new medical care provider has questions about ${patientPossessiveText} care with *company-data-covered*, please have them contact us.\n\nIf you have any additional questions or feel ${patientPossessiveText} reason for resolution/ dismissal is no longer applicable, please contact the Patient Experience Department at 1-855-284-4680, Monday through Friday from 8:00a - 5:00p MST.`,
      };
    default:
      return {
        title: '',
        message: '',
      };
  }
};
