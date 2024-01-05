import {
  MANAGE_SELF_SCHEDULE_SLICE_KEY,
  OffboardReason,
  RelationToPatient,
  manageSelfScheduleInitialState,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import { render, screen, testSegmentPageView } from '../../testUtils';
import { Offboard } from './Offboard';
import { OFFBOARD_SECTION_TEST_IDS } from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import { SEGMENT_EVENTS } from '../constants';

const setup = (
  relationToPatient: RelationToPatient,
  offboardReason: OffboardReason
) =>
  render(<Offboard />, {
    preloadedState: {
      [MANAGE_SELF_SCHEDULE_SLICE_KEY]: {
        ...manageSelfScheduleInitialState,
        offboardReason,
        data: {
          ...manageSelfScheduleInitialState.data,
          requester: {
            relationToPatient,
          },
        },
      },
    },
  });

describe('<Offboard />', () => {
  it.each([
    {
      relationship: 'relation to patient is patient',
      relationToPatient: RelationToPatient.Patient,
      providedOffboardReason: `${OffboardReason.AcuitySegmentation} offboard reason`,
      offboardReason: OffboardReason.AcuitySegmentation,
      expectedResult: {
        title:
          'We apologize, we don’t have an appropriate team available to care for you today.',
        message:
          'We encourage you to call your primary care provider or seek care at a facility.',
      },
    },
    {
      relationship: 'relation to patient is someone else',
      relationToPatient: RelationToPatient.Other,
      providedOffboardReason: `${OffboardReason.AcuitySegmentation} offboard reason`,
      offboardReason: OffboardReason.AcuitySegmentation,
      expectedResult: {
        title:
          'We apologize, we don’t have an appropriate team available to care for the patient today.',
        message:
          'We encourage you to call their primary care provider or seek care at a facility.',
      },
    },
    {
      relationship: 'relation to patient is patient',
      relationToPatient: RelationToPatient.Patient,
      providedOffboardReason: `${OffboardReason.FullyBooked} offboard reason`,
      offboardReason: OffboardReason.FullyBooked,
      expectedResult: {
        title: 'We’re sorry, but we’re fully booked today and tomorrow.',
        message:
          'We encourage you to call your primary care provider or seek care at a facility.',
      },
    },
    {
      relationship: 'relation to patient is someone else',
      relationToPatient: RelationToPatient.Other,
      providedOffboardReason: `${OffboardReason.FullyBooked} offboard reason`,
      offboardReason: OffboardReason.FullyBooked,
      expectedResult: {
        title: 'We’re sorry, but we’re fully booked today and tomorrow.',
        message:
          'We encourage you to call their primary care provider or seek care at a facility.',
      },
    },
    {
      relationship: 'relation to patient is patient',
      relationToPatient: RelationToPatient.Patient,
      providedOffboardReason: `${OffboardReason.DismissedPatient} offboard reason`,
      offboardReason: OffboardReason.DismissedPatient,
      expectedResult: {
        title:
          'Your request for medical care from *company-data-covered* cannot be scheduled due to past encounters.',
        message:
          'As we will no longer furnish your care, you should find another servicer for your healthcare needs.',
      },
    },
    {
      relationship: 'relation to patient is someone else',
      relationToPatient: RelationToPatient.Other,
      providedOffboardReason: `${OffboardReason.DismissedPatient} offboard reason`,
      offboardReason: OffboardReason.DismissedPatient,
      expectedResult: {
        title:
          'Your request for medical care from *company-data-covered* cannot be scheduled due to past encounters.',
        message:
          'As we will no longer furnish their care, you should find another servicer for their healthcare needs.',
      },
    },
  ])(
    'should render correctly if $relationship and $providedOffboardReason',
    async ({ relationToPatient, offboardReason, expectedResult }) => {
      setup(relationToPatient, offboardReason);

      await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_OFFBOARD);

      const offboardTitle = screen.getByTestId(OFFBOARD_SECTION_TEST_IDS.TITLE);
      expect(offboardTitle).toBeVisible();
      expect(offboardTitle).toHaveTextContent(expectedResult.title);

      const offbaordMessage = screen.getByTestId(
        OFFBOARD_SECTION_TEST_IDS.MESSAGE
      );
      expect(offbaordMessage).toBeVisible();
      expect(offbaordMessage).toHaveTextContent(expectedResult.message);
    }
  );
});
