import { mocked } from 'jest-mock';
import {
  mockPreLoginRequester,
  RelationToPatient,
  selectPreLoginRequester,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import {
  FORM_FOOTER_TEST_IDS,
  FORM_HEADER_TEST_IDS,
  PAGE_LAYOUT_TEST_IDS,
  TIME_RANGE_SELECTOR_TEST_IDS,
  TIME_WINDOWS_SECTION_TEST_IDS,
  TimeOptionType,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import { FORM_SELECT_MENU_ITEM_TEST_IDS } from '@*company-data-covered*/shared/ui/forms';
import {
  render,
  screen,
  waitFor,
  within,
  testSegmentPageView,
} from '../../testUtils';
import {
  ONLINE_SELF_SCHEDULING_ROUTES,
  RequestProgressStep,
  SEGMENT_EVENTS,
} from '../constants';
import {
  getDefaultHour,
  getFormMessagesByRelationToPatient,
  MAX_PRE_LOGIN__AVAILABILITY_HOUR,
  MIN_PRE_LOGIN_AVAILABILITY_HOUR,
  PreferredTime,
} from './PreferredTime';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock(
  '@*company-data-covered*/consumer-web/online-self-scheduling/data-access',
  () => ({
    ...jest.requireActual(
      '@*company-data-covered*/consumer-web/online-self-scheduling/data-access'
    ),
    selectPreLoginRequester: jest.fn(),
  })
);

const mockSelectPreLoginRequester = mocked(
  selectPreLoginRequester
).mockReturnValue(mockPreLoginRequester);

const getFormHeaderTitle = () => screen.getByTestId(FORM_HEADER_TEST_IDS.TITLE);

const getFormHeaderSubtitle = () =>
  screen.getByTestId(FORM_HEADER_TEST_IDS.SUBTITLE);

const getTimeWindowsSectionContainer = () =>
  screen.getByTestId(TIME_WINDOWS_SECTION_TEST_IDS.CONTAINER);

const getStartTimeRangeSelect = () =>
  screen.getByTestId(
    TIME_RANGE_SELECTOR_TEST_IDS.getFieldTestId(
      TIME_WINDOWS_SECTION_TEST_IDS.START_TIME_RANGE_SELECTOR_PREFIX
    )
  );

const getStartTimeRangeSelectInput = () =>
  screen.getByTestId(
    TIME_RANGE_SELECTOR_TEST_IDS.getInputTestId(
      TIME_WINDOWS_SECTION_TEST_IDS.START_TIME_RANGE_SELECTOR_PREFIX
    )
  );

const findStartTimeRangeSelectOption = (value: string) => {
  const startTimeRangeMenuItemTestId =
    TIME_RANGE_SELECTOR_TEST_IDS.getMenuItemTestIdPrefix(
      TIME_WINDOWS_SECTION_TEST_IDS.START_TIME_RANGE_SELECTOR_PREFIX
    );

  return screen.findByTestId(
    FORM_SELECT_MENU_ITEM_TEST_IDS.getFormSelectMenuItem(
      startTimeRangeMenuItemTestId,
      value
    )
  );
};

const getEndTimeRangeSelect = () =>
  screen.getByTestId(
    TIME_RANGE_SELECTOR_TEST_IDS.getFieldTestId(
      TIME_WINDOWS_SECTION_TEST_IDS.END_TIME_RANGE_SELECTOR_PREFIX
    )
  );

const getEndTimeRangeSelectInput = () =>
  screen.getByTestId(
    TIME_RANGE_SELECTOR_TEST_IDS.getInputTestId(
      TIME_WINDOWS_SECTION_TEST_IDS.END_TIME_RANGE_SELECTOR_PREFIX
    )
  );

const findEndTimeRangeSelectOption = (value: string) => {
  const endTimeRangeMenuItemTestId =
    TIME_RANGE_SELECTOR_TEST_IDS.getMenuItemTestIdPrefix(
      TIME_WINDOWS_SECTION_TEST_IDS.END_TIME_RANGE_SELECTOR_PREFIX
    );

  return screen.findByTestId(
    FORM_SELECT_MENU_ITEM_TEST_IDS.getFormSelectMenuItem(
      endTimeRangeMenuItemTestId,
      value
    )
  );
};

const getFormFooterSubmitButton = () =>
  screen.getByTestId(FORM_FOOTER_TEST_IDS.SUBMIT_BUTTON);

const setup = () => {
  return render(<PreferredTime />);
};

describe('<PreferredTime />', () => {
  it('should render correctly', async () => {
    setup();

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_PREFERRED_TIME);

    const title = getFormHeaderTitle();
    expect(title).toBeVisible();
    expect(title).toHaveTextContent(
      'When are you available for an appointment?'
    );

    const subtitle = getFormHeaderSubtitle();
    expect(subtitle).toBeVisible();
    expect(subtitle).toHaveTextContent(
      'The more availability you have, the more likely we can see you today.'
    );

    const requestProgressBar = screen.getByTestId(
      PAGE_LAYOUT_TEST_IDS.REQUEST_PROGRESS_BAR
    );
    expect(requestProgressBar).toBeVisible();
    expect(requestProgressBar).toHaveAttribute(
      'aria-valuenow',
      RequestProgressStep.PreferredTime.toString()
    );

    const timeWindowsSectionContainer = getTimeWindowsSectionContainer();
    expect(timeWindowsSectionContainer).toBeVisible();
    expect(timeWindowsSectionContainer).toHaveTextContent('I’m available');

    const todayToggle = screen.getByTestId(
      TIME_WINDOWS_SECTION_TEST_IDS.TODAY_TOGGLE
    );
    expect(todayToggle).toBeVisible();
    expect(todayToggle).toHaveTextContent('Today');

    const tomorrowToggle = screen.getByTestId(
      TIME_WINDOWS_SECTION_TEST_IDS.TOMORROW_TOGGLE
    );
    expect(tomorrowToggle).toBeVisible();
    expect(tomorrowToggle).toHaveTextContent('Tomorrow');

    const startTimeRangeSelector = screen.getByTestId(
      TIME_RANGE_SELECTOR_TEST_IDS.getTitleTestId(
        TIME_WINDOWS_SECTION_TEST_IDS.START_TIME_RANGE_SELECTOR_PREFIX
      )
    );
    expect(startTimeRangeSelector).toBeVisible();

    const endTimeRangeSelector = screen.getByTestId(
      TIME_RANGE_SELECTOR_TEST_IDS.getTitleTestId(
        TIME_WINDOWS_SECTION_TEST_IDS.END_TIME_RANGE_SELECTOR_PREFIX
      )
    );
    expect(endTimeRangeSelector).toBeVisible();

    const submitButton = getFormFooterSubmitButton();
    expect(submitButton).toBeVisible();
    expect(submitButton).toBeEnabled();
  });

  it('should render correct messages for non self relationship', async () => {
    mockSelectPreLoginRequester.mockReturnValueOnce({
      ...mockPreLoginRequester,
      relationToPatient: RelationToPatient.Clinician,
    });

    setup();

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_PREFERRED_TIME);

    const title = getFormHeaderTitle();
    expect(title).toBeVisible();
    expect(title).toHaveTextContent(
      'When is the patient available for an appointment?'
    );

    const subtitle = getFormHeaderSubtitle();
    expect(subtitle).toBeVisible();
    expect(subtitle).toHaveTextContent(
      'The more availability they have, the more likely we can see them today.'
    );

    const timeWindowsSectionContainer = getTimeWindowsSectionContainer();
    expect(timeWindowsSectionContainer).toBeVisible();
    expect(timeWindowsSectionContainer).toHaveTextContent(
      'Patient is available'
    );
  });

  it('should change preferred eta range on submit', async () => {
    const { user } = setup();

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_PREFERRED_TIME);

    const todayToggle = screen.getByTestId(
      TIME_WINDOWS_SECTION_TEST_IDS.TODAY_TOGGLE
    );
    expect(todayToggle).toBeVisible();
    expect(todayToggle).toHaveTextContent('Today');

    const tomorrowToggle = screen.getByTestId(
      TIME_WINDOWS_SECTION_TEST_IDS.TOMORROW_TOGGLE
    );
    expect(tomorrowToggle).toBeVisible();

    await user.click(tomorrowToggle);

    const startTimeRangeSelectInput = getStartTimeRangeSelectInput();
    expect(startTimeRangeSelectInput).toHaveValue(
      MIN_PRE_LOGIN_AVAILABILITY_HOUR.toString()
    );

    const startTimeRangeSelect = getStartTimeRangeSelect();
    expect(startTimeRangeSelect).toBeVisible();

    const startTimeRangeSelectButton =
      within(startTimeRangeSelect).getByRole('button');
    expect(startTimeRangeSelectButton).toBeVisible();

    await user.click(startTimeRangeSelectButton);

    const selectedFirstMenuItem: TimeOptionType = {
      value: '10',
      label: '10:00 am',
    };
    const firstMenuItem = await findStartTimeRangeSelectOption(
      selectedFirstMenuItem.value
    );
    expect(firstMenuItem).toBeVisible();

    await user.click(firstMenuItem);

    const endTimeRangeSelectInput = getEndTimeRangeSelectInput();
    expect(endTimeRangeSelectInput).toHaveValue(
      MAX_PRE_LOGIN__AVAILABILITY_HOUR.toString()
    );

    const endTimeRangeSelect = getEndTimeRangeSelect();
    expect(endTimeRangeSelect).toBeVisible();

    const endTimeRangeSelectButton =
      within(endTimeRangeSelect).getByRole('button');
    expect(endTimeRangeSelectButton).toBeVisible();

    await user.click(endTimeRangeSelectButton);

    const selectedSecondMenuItem: TimeOptionType = {
      value: '16',
      label: '04:00 pm',
    };
    const secondMenuItem = await findEndTimeRangeSelectOption(
      selectedSecondMenuItem.value
    );
    expect(secondMenuItem).toBeVisible();

    await user.click(secondMenuItem);

    const submitButton = getFormFooterSubmitButton();
    expect(submitButton).toBeVisible();
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    await waitFor(() => {
      expect(startTimeRangeSelectInput).toHaveValue('10');
    });
    expect(endTimeRangeSelectInput).toHaveValue('16');

    expect(mockNavigate).toBeCalledWith(
      ONLINE_SELF_SCHEDULING_ROUTES.PATIENT_DEMOGRAPHICS
    );
  });

  it('should display time range error on invalid time range selection', async () => {
    const { user } = setup();

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_PREFERRED_TIME);

    const todayToggle = screen.getByTestId(
      TIME_WINDOWS_SECTION_TEST_IDS.TODAY_TOGGLE
    );
    expect(todayToggle).toBeVisible();
    expect(todayToggle).toHaveTextContent('Today');

    const tomorrowToggle = screen.getByTestId(
      TIME_WINDOWS_SECTION_TEST_IDS.TOMORROW_TOGGLE
    );
    expect(tomorrowToggle).toBeVisible();

    await user.click(tomorrowToggle);

    const startTimeRangeSelectInput = getStartTimeRangeSelectInput();
    expect(startTimeRangeSelectInput).toHaveValue(
      MIN_PRE_LOGIN_AVAILABILITY_HOUR.toString()
    );

    const startTimeRangeSelect = getStartTimeRangeSelect();
    expect(startTimeRangeSelect).toBeVisible();

    const startTimeRangeSelectButton =
      within(startTimeRangeSelect).getByRole('button');
    expect(startTimeRangeSelectButton).toBeVisible();

    await user.click(startTimeRangeSelectButton);

    const selectedFirstMenuItem: TimeOptionType = {
      value: '10',
      label: '10:00 am',
    };
    const firstMenuItem = await findStartTimeRangeSelectOption(
      selectedFirstMenuItem.value
    );
    expect(firstMenuItem).toBeVisible();

    await user.click(firstMenuItem);

    const endTimeRangeSelectInput = getEndTimeRangeSelectInput();
    expect(endTimeRangeSelectInput).toHaveValue(
      MAX_PRE_LOGIN__AVAILABILITY_HOUR.toString()
    );

    const endTimeRangeSelect = getEndTimeRangeSelect();
    expect(endTimeRangeSelect).toBeVisible();

    const endTimeRangeSelectButton =
      within(endTimeRangeSelect).getByRole('button');
    expect(endTimeRangeSelectButton).toBeVisible();

    await user.click(endTimeRangeSelectButton);

    const selectedSecondMenuItem: TimeOptionType = {
      value: '11',
      label: '11:00 pm',
    };
    const secondMenuItem = await findEndTimeRangeSelectOption(
      selectedSecondMenuItem.value
    );
    expect(secondMenuItem).toBeVisible();

    await user.click(secondMenuItem);

    const timeRangeError = await screen.findByTestId(
      TIME_WINDOWS_SECTION_TEST_IDS.TIME_RANGE_ERROR
    );
    expect(timeRangeError).toBeVisible();
    expect(timeRangeError).toHaveTextContent(
      'Please select a minimum 4 hour time window.'
    );

    const submitButton = getFormFooterSubmitButton();
    expect(submitButton).toBeVisible();
    expect(submitButton).toBeDisabled();
  });
});

describe('getDefaultHour', () => {
  it.each([
    {
      dateString: '2022-01-18T14:33:37.000',
      fallbackValue: '8',
      expected: '14',
    },
    {
      dateString: 'invalid date',
      fallbackValue: '8',
      expected: '8',
    },
    {
      dateString: undefined,
      expected: '',
    },
  ])(
    'should return correct hour for $dateString',
    ({ expected, dateString, fallbackValue }) => {
      const result = getDefaultHour(dateString, fallbackValue);
      expect(result).toBe(expected);
    }
  );
});

describe('getFormMessagesByRelationToPatient', () => {
  it.each([
    {
      relationToPatient: RelationToPatient.Patient,
      fallbackValue: '8',
      expected: {
        title: 'When are you available for an appointment?',
        subtitle:
          'The more availability you have, the more likely we can see you today.',
        timeWindowSectionTitle: 'I’m available',
      },
    },
    {
      relationToPatient: RelationToPatient.FamilyFriend,
      expected: {
        title: 'When is the patient available for an appointment?',
        subtitle:
          'The more availability they have, the more likely we can see them today.',
        timeWindowSectionTitle: 'Patient is available',
      },
    },
  ])(
    'should return correct messages for $relationToPatient',
    ({ expected, relationToPatient }) => {
      const result = getFormMessagesByRelationToPatient(relationToPatient);
      expect(result).toStrictEqual(expected);
    }
  );
});
