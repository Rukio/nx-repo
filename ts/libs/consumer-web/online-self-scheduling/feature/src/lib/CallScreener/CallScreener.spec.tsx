import statsig, { DynamicConfig, EvaluationReason } from 'statsig-js';
import { mocked } from 'jest-mock';
import { SCREENING_REQUIRED_TEST_IDS } from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import {
  manageSelfScheduleInitialState,
  MANAGE_SELF_SCHEDULE_SLICE_KEY,
  mockMarket,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import { useSegment } from '@*company-data-covered*/segment/feature';
import {
  render,
  screen,
  renderHook,
  testSegmentPageView,
  waitFor,
} from '../../testUtils';
import { CallScreener, CallScreenerProps } from './CallScreener';
import {
  RISK_STRAT_MAPPING_FOR_OSS_CONFIG_NAME,
  StructuredSymptom,
  StructuredSymptomCallTo,
} from '../utils/statsig';
import { SEGMENT_EVENTS } from '../constants';
import { formatPhoneNumber } from '../utils/phoneNumber';

jest.mock('statsig-js', () => ({
  ...jest.requireActual('statsig-js'),
  getConfig: jest.fn(),
  checkGate: jest.fn(),
}));

const getContactUsMessage = () =>
  screen.getByTestId(SCREENING_REQUIRED_TEST_IDS.CONTACT_US_MESSAGE);

const mockGetConfig = mocked(statsig.getConfig);
const mockCheckGate = mocked(statsig.checkGate);

const mockProps: CallScreenerProps = {
  dispatcherPhoneNumber: '2025550174',
};

const mockSymptoms = 'my symptoms';

const getMockDispatcherStructuredSymptoms = (
  callTo: StructuredSymptomCallTo = StructuredSymptomCallTo.Dispatcher
): StructuredSymptom[] => [
  {
    friendly_name: mockSymptoms,
    is_oss_eligible: true,
    legacy_rs_protocol: 'test',
    route_call_to: callTo,
    legacy_rs_protocol_id: 1,
  },
];

const getCallButton = () =>
  screen.getByTestId(SCREENING_REQUIRED_TEST_IDS.CALL_BUTTON);

const setup = () => {
  return render(<CallScreener {...mockProps} />, {
    preloadedState: {
      [MANAGE_SELF_SCHEDULE_SLICE_KEY]: {
        ...manageSelfScheduleInitialState,
        data: {
          ...manageSelfScheduleInitialState.data,
          symptoms: mockSymptoms,
          marketId: mockMarket.id,
        },
      },
    },
  });
};

const formatedDispatcherPhoneNumber = '202-555-0174';

describe('<CallScreener />', () => {
  it.each([
    {
      structuredSymptoms: getMockDispatcherStructuredSymptoms(),
      expectedPhone: formatedDispatcherPhoneNumber,
      isStationCallCenterLineEnabled: false,
    },
    {
      structuredSymptoms: getMockDispatcherStructuredSymptoms(
        StructuredSymptomCallTo.Screener
      ),
      expectedPhone: formatPhoneNumber(
        mockMarket.stateLocale.screenerLine.phoneNumber
      ),
      isStationCallCenterLineEnabled: false,
    },
    {
      structuredSymptoms: [],
      expectedPhone: formatedDispatcherPhoneNumber,
      isStationCallCenterLineEnabled: false,
    },
    {
      structuredSymptoms: getMockDispatcherStructuredSymptoms(),
      expectedPhone: mockMarket.stateLocale.dispatcherLine.phoneNumber,
      isStationCallCenterLineEnabled: true,
    },
    {
      structuredSymptoms: [],
      expectedPhone: mockMarket.stateLocale.dispatcherLine.phoneNumber,
      isStationCallCenterLineEnabled: true,
    },
  ])(
    'should render properly',
    async ({
      expectedPhone,
      structuredSymptoms,
      isStationCallCenterLineEnabled,
    }) => {
      mockCheckGate.mockReturnValue(isStationCallCenterLineEnabled);
      mockGetConfig.mockReturnValue(
        new DynamicConfig(
          RISK_STRAT_MAPPING_FOR_OSS_CONFIG_NAME,
          {
            structured_symptoms: structuredSymptoms,
          },
          'ruleId',
          { time: 0, reason: EvaluationReason.Bootstrap }
        )
      );
      const { user } = setup();
      const { result: segmentHook } = renderHook(() => useSegment());

      await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_SCREENING);

      const contactUsMessage = getContactUsMessage();
      expect(contactUsMessage).toHaveTextContent(
        `To complete your check-in and lock in an appointment time, please call us at ${expectedPhone}.`
      );

      const callButton = getCallButton();
      expect(callButton).toBeEnabled();
      expect(callButton).toHaveAttribute('href', `tel:${expectedPhone}`);

      await user.click(callButton);

      await waitFor(() => {
        expect(segmentHook.current.track).toBeCalledTimes(1);
      });

      await waitFor(() => {
        expect(segmentHook.current.track).toBeCalledWith(
          SEGMENT_EVENTS.SCREENING_CLICK_CALL
        );
      });
    }
  );
});
