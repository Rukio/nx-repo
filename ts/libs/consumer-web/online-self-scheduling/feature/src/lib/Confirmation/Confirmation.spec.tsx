import {
  PAGE_LAYOUT_TEST_IDS,
  FORM_HEADER_TEST_IDS,
  SELF_SCHEDULING_CONFIRMATION_TEST_IDS,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import { render, screen, waitFor, testSegmentPageView } from '../../testUtils';
import { Confirmation } from './Confirmation';
import {
  mockCareRequest,
  mockEtaRange,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import { buildCareRequestApiPath, mswServer } from '../../testUtils/server';
import { rest } from 'msw';
import { getAvailabilityDay } from '../utils/date';
import { SEGMENT_EVENTS } from '../constants';
import { formatPhoneNumber } from '../utils/phoneNumber';

const findPageLoader = () => screen.findByTestId(PAGE_LAYOUT_TEST_IDS.LOADER);

const getSelfScheduleConfirmationTitle = () =>
  screen.getByTestId(FORM_HEADER_TEST_IDS.TITLE);

const getSelfScheduleConfirmationSubtitle = () =>
  screen.getByTestId(FORM_HEADER_TEST_IDS.SUBTITLE);

const getSelfScheduleMedicalConcernsMessage = () =>
  screen.getByTestId(
    SELF_SCHEDULING_CONFIRMATION_TEST_IDS.MEDICAL_CONCERNS_MESSAGE
  );

const mockedDispatcherPhoneNumber = '2025550174';

const setup = () => {
  return render(
    <Confirmation dispatcherPhoneNumber={mockedDispatcherPhoneNumber} />
  );
};

describe('<Confirmation />', () => {
  it('should render properly', async () => {
    mswServer.use(
      rest.get(buildCareRequestApiPath(), (_req, res, ctx) => {
        return res.once(
          ctx.status(200),
          ctx.json({ data: { ...mockCareRequest, etaRanges: [mockEtaRange] } })
        );
      })
    );

    setup();

    const availibilityDay = getAvailabilityDay(mockEtaRange.startsAt);

    const pageLoader = await findPageLoader();
    await waitFor(() => {
      expect(pageLoader).not.toBeInTheDocument();
    });

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_SCHEDULE);

    const selfScheduleConfirmationTitle = getSelfScheduleConfirmationTitle();
    expect(selfScheduleConfirmationTitle).toBeVisible();
    expect(selfScheduleConfirmationTitle).toHaveTextContent(
      'Appointment confirmed!'
    );

    const selfScheduleConfirmationSubtitle =
      getSelfScheduleConfirmationSubtitle();
    expect(selfScheduleConfirmationSubtitle).toBeVisible();
    expect(selfScheduleConfirmationSubtitle).toHaveTextContent(
      `Your medical team will be out to see you ${availibilityDay} between 8:44 AM and 2:44 PM.You'll receive a text message with a link to check-in for your appointment and track your care team's status.`
    );

    const selfScheduleMedicalConcernsMessage =
      getSelfScheduleMedicalConcernsMessage();
    expect(selfScheduleMedicalConcernsMessage).toBeVisible();
    expect(selfScheduleMedicalConcernsMessage).toHaveTextContent(
      `Medical conditions may change quickly. If you have new or worsening symptoms before our team arrives, please call us at ${formatPhoneNumber(
        mockedDispatcherPhoneNumber
      )}, call 911, or go to the emergency department if you feel that may be necessary.`
    );
  });
});
