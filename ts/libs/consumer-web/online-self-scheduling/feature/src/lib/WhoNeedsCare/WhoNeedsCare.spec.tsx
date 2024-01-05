import { RelationToPatient } from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import {
  FORM_FOOTER_TEST_IDS,
  FORM_HEADER_TEST_IDS,
  PAGE_LAYOUT_TEST_IDS,
  REQUEST_CARE_FORM_TEST_IDS,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import statsig, { DynamicConfig, EvaluationReason } from 'statsig-js';
import { useSegment } from '@*company-data-covered*/segment/feature';
import { FORM_SELECT_MENU_ITEM_TEST_IDS } from '@*company-data-covered*/shared/ui/forms';
import {
  render,
  screen,
  waitFor,
  within,
  renderHook,
  testSegmentPageView,
} from '../../testUtils';
import {
  ONLINE_SELF_SCHEDULING_ROUTES,
  RequestProgressStep,
  SEGMENT_EVENTS,
} from '../constants';
import { WhoNeedsCare } from './WhoNeedsCare';
import { mocked } from 'jest-mock';
import {
  CHANNEL_ITEM_TO_MEDIUM_MAPPING_CONFIG_NAME,
  ChannelItem,
} from '../utils/statsig';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('statsig-js', () => ({
  ...jest.requireActual('statsig-js'),
  getConfig: jest.fn(),
}));

const mockGetConfig = mocked(statsig.getConfig);

const mockedChannelItems: ChannelItem[] = [
  {
    medium: 'organic',
    channel_item_name: 'Google or Other Search',
    channel_item_id: 7,
  },
];

const mockedDefaultChannelItem: ChannelItem = {
  channel_item_name: 'Digital',
  channel_item_id: 21136,
};

mockGetConfig.mockReturnValue(
  new DynamicConfig(
    CHANNEL_ITEM_TO_MEDIUM_MAPPING_CONFIG_NAME,
    {
      channel_items: mockedChannelItems,
      default_channel_item: mockedDefaultChannelItem,
    },
    'ruleId',
    {
      time: 0,
      reason: EvaluationReason.Bootstrap,
    }
  )
);

const getRelationshipSelect = () =>
  screen.getByTestId(REQUEST_CARE_FORM_TEST_IDS.RELATIONSHIP_SELECT);

const getRelationshipSelectInput = () =>
  screen.getByTestId(REQUEST_CARE_FORM_TEST_IDS.RELATIONSHIP_SELECT_INPUT);

const findRelationshipMenuItem = (value: RelationToPatient) =>
  screen.findByTestId(
    FORM_SELECT_MENU_ITEM_TEST_IDS.getFormSelectMenuItem(
      REQUEST_CARE_FORM_TEST_IDS.RELATIONSHIP_SELECT_ITEM_PREFIX,
      value
    )
  );

const setup = () => {
  return render(<WhoNeedsCare />);
};

describe('<WhoNeedsCare />', () => {
  it('should render correctly', async () => {
    setup();

    const title = await screen.findByTestId(FORM_HEADER_TEST_IDS.TITLE);
    expect(title).toBeVisible();

    const requestProgressBar = screen.getByTestId(
      PAGE_LAYOUT_TEST_IDS.REQUEST_PROGRESS_BAR
    );
    expect(requestProgressBar).toBeVisible();
    expect(requestProgressBar).toHaveAttribute(
      'aria-valuenow',
      RequestProgressStep.WhoNeedsCare.toString()
    );

    const submitButton = screen.getByTestId(FORM_FOOTER_TEST_IDS.SUBMIT_BUTTON);
    expect(submitButton).toBeVisible();
    expect(submitButton).toBeDisabled();

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_REQUEST_CARE_FOR);
  });

  it('should change relation to patient on submit and navigate to symptoms', async () => {
    const { user } = setup();
    const { result: segmentHook } = renderHook(() => useSegment());

    const relationshipSelect = getRelationshipSelect();
    expect(relationshipSelect).toBeVisible();

    const relationshipSelectInput = getRelationshipSelectInput();
    expect(relationshipSelectInput).toHaveValue(RelationToPatient.Patient);

    const relationshipSelectButton =
      within(relationshipSelect).getByRole('button');
    expect(relationshipSelectButton).toBeVisible();

    await user.click(relationshipSelectButton);

    const relationshipMenuItem = await findRelationshipMenuItem(
      RelationToPatient.FamilyFriend
    );
    expect(relationshipMenuItem).toBeVisible();
    expect(relationshipMenuItem).toHaveTextContent('A friend or family member');

    await user.click(relationshipMenuItem);

    const submitButton = screen.getByTestId(FORM_FOOTER_TEST_IDS.SUBMIT_BUTTON);
    expect(submitButton).toBeVisible();
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_REQUEST_CARE_FOR);

    await waitFor(() => {
      expect(segmentHook.current.track).toBeCalledWith(
        SEGMENT_EVENTS.SUBMIT_REQUEST_CARE_FOR_SELECT,
        {
          [SEGMENT_EVENTS.SUBMIT_REQUEST_CARE_FOR_SELECT]:
            RelationToPatient.FamilyFriend,
        }
      );
    });

    await waitFor(() => {
      expect(relationshipSelectInput).toHaveValue(
        RelationToPatient.FamilyFriend
      );
    });

    expect(mockNavigate).toBeCalledWith(ONLINE_SELF_SCHEDULING_ROUTES.SYMPTOMS);
  });
});
