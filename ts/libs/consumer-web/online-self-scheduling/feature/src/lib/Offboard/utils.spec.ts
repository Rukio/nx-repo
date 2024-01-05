import { OffboardReason } from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import { getOffboardData } from './utils';

describe('utils', () => {
  describe('getOffboardData', () => {
    it.each([
      {
        providedOffboardReason: `${OffboardReason.AcuitySegmentation} offboard reason`,
        offboardReason: OffboardReason.AcuitySegmentation,
        isRequesterRelationshipSelf: true,
        relationship: 'self requester relationship',
        expectedResult: {
          title:
            'We apologize, we don’t have an appropriate team available to care for you today.',
          message:
            'We encourage you to call your primary care provider or seek care at a facility.',
        },
      },
      {
        providedOffboardReason: `${OffboardReason.AcuitySegmentation} offboard reason`,
        offboardReason: OffboardReason.AcuitySegmentation,
        isRequesterRelationshipSelf: false,
        relationship: 'someone else requester relationship',
        expectedResult: {
          title:
            'We apologize, we don’t have an appropriate team available to care for the patient today.',
          message:
            'We encourage you to call their primary care provider or seek care at a facility.',
        },
      },
      {
        providedOffboardReason: `${OffboardReason.FullyBooked} offboard reason`,
        offboardReason: OffboardReason.FullyBooked,
        isRequesterRelationshipSelf: true,
        relationship: 'self requester relationship',
        expectedResult: {
          title: 'We’re sorry, but we’re fully booked today and tomorrow.',
          message:
            'We encourage you to call your primary care provider or seek care at a facility.',
        },
      },
      {
        providedOffboardReason: `${OffboardReason.FullyBooked} offboard reason`,
        offboardReason: OffboardReason.FullyBooked,
        isRequesterRelationshipSelf: false,
        relationship: 'someone else requester relationship',
        expectedResult: {
          title: 'We’re sorry, but we’re fully booked today and tomorrow.',
          message:
            'We encourage you to call their primary care provider or seek care at a facility.',
        },
      },
      {
        providedOffboardReason: `${OffboardReason.DismissedPatient} offboard reason`,
        offboardReason: OffboardReason.DismissedPatient,
        isRequesterRelationshipSelf: true,
        relationship: 'self requester relationship',
        expectedResult: {
          title:
            'Your request for medical care from *company-data-covered* cannot be scheduled due to past encounters.',
          message:
            'As we will no longer furnish your care, you should find another servicer for your healthcare needs.\n\nYour medical records are available in the patient portal. If your new medical care provider has questions about your care with *company-data-covered*, upon your written authorization we will send them copies of your records. If your new medical care provider has questions about your care with *company-data-covered*, please have them contact us.\n\nIf you have any additional questions or feel your reason for resolution/ dismissal is no longer applicable, please contact the Patient Experience Department at 1-855-284-4680, Monday through Friday from 8:00a - 5:00p MST.',
        },
      },
      {
        providedOffboardReason: `${OffboardReason.DismissedPatient} offboard reason`,
        offboardReason: OffboardReason.DismissedPatient,
        isRequesterRelationshipSelf: false,
        relationship: 'someone else requester relationship',
        expectedResult: {
          title:
            'Your request for medical care from *company-data-covered* cannot be scheduled due to past encounters.',
          message:
            'As we will no longer furnish their care, you should find another servicer for their healthcare needs.\n\nTheir medical records are available in the patient portal. If their new medical care provider has questions about their care with *company-data-covered*, upon their written authorization we will send them copies of their records. If their new medical care provider has questions about their care with *company-data-covered*, please have them contact us.\n\nIf you have any additional questions or feel their reason for resolution/ dismissal is no longer applicable, please contact the Patient Experience Department at 1-855-284-4680, Monday through Friday from 8:00a - 5:00p MST.',
        },
      },
    ])(
      'should return correct offboard data for $providedOffboardReason and $relationship',
      ({ offboardReason, isRequesterRelationshipSelf, expectedResult }) => {
        const result = getOffboardData(
          isRequesterRelationshipSelf,
          offboardReason
        );
        expect(result).toEqual(expectedResult);
      }
    );
  });
});
