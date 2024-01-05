import statsig, { DynamicConfig, EvaluationReason } from 'statsig-js';
import { mocked } from 'jest-mock';
import {
  ADDITIONAL_SYMPTOMS_CONFIRMATION_TEST_IDS,
  FORM_FOOTER_TEST_IDS,
  PAGE_LAYOUT_TEST_IDS,
  SYMPTOMS_FORM_TEST_IDS,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import { useSegment } from '@*company-data-covered*/segment/feature';
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
import { Symptoms } from './Symptoms';
import {
  RISK_STRAT_MAPPING_FOR_OSS_CONFIG_NAME,
  StructuredSymptom,
  StructuredSymptomCallTo,
} from '../utils/statsig';

jest.mock('statsig-js', () => ({
  ...jest.requireActual('statsig-js'),
  getConfig: jest.fn(),
}));

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockGetConfig = mocked(statsig.getConfig);

const mockStructuredSymptoms: StructuredSymptom[] = [
  {
    friendly_name: 'cough',
    is_oss_eligible: false,
    legacy_rs_protocol: 'test protocol',
    route_call_to: StructuredSymptomCallTo.Screener,
    legacy_rs_protocol_id: 1,
  },
  {
    friendly_name: 'headache',
    is_oss_eligible: false,
    legacy_rs_protocol: 'test protocol',
    route_call_to: StructuredSymptomCallTo.Screener,
    legacy_rs_protocol_id: 1,
  },
];

mockGetConfig.mockReturnValue(
  new DynamicConfig(
    RISK_STRAT_MAPPING_FOR_OSS_CONFIG_NAME,
    { structured_symptoms: mockStructuredSymptoms },
    'ruleId',
    {
      time: 0,
      reason: EvaluationReason.Bootstrap,
    }
  )
);

const getAucompleteFieldCombobox = () => {
  const autocompleteField = screen.getByTestId(
    SYMPTOMS_FORM_TEST_IDS.AUTOCOMPLETE_FIELD
  );

  return within(autocompleteField).getByRole('combobox');
};

const findAllAutocompleteOptions = () =>
  screen.findAllByTestId(
    new RegExp(SYMPTOMS_FORM_TEST_IDS.AUTCOMPLETE_DROPDOWN_OPTION_PREFIX)
  );

const findAutocompleteOption = (option: string) =>
  screen.findByTestId(
    SYMPTOMS_FORM_TEST_IDS.getAutocompleteDropdownOption(option)
  );

const findAdditionalSymptomsConfirmationRoot = () =>
  screen.findByTestId(ADDITIONAL_SYMPTOMS_CONFIRMATION_TEST_IDS.ROOT);

const getAdditionalSymptomsConfirmationCheckboxField = () =>
  screen.getByTestId(ADDITIONAL_SYMPTOMS_CONFIRMATION_TEST_IDS.CHECKBOX_FIELD);

const getAdditionalSymptomsConfirmationCheckbox = () => {
  const checkboxField = screen.getByTestId(
    ADDITIONAL_SYMPTOMS_CONFIRMATION_TEST_IDS.CHECKBOX_FIELD
  );

  return within(checkboxField).getByRole('checkbox');
};

const getCustomSymptomsButton = () =>
  screen.getByTestId(SYMPTOMS_FORM_TEST_IDS.CUSTOM_SYMPTOM_INPUT_BUTTON);

const findCustomSymptomsInput = () =>
  screen.findByTestId(SYMPTOMS_FORM_TEST_IDS.CUSTOM_SYMPTOM_INPUT);

const setup = () => {
  return render(<Symptoms />);
};

describe('<Symptoms />', () => {
  it('should render correctly', async () => {
    setup();

    const requestProgressBar = screen.getByTestId(
      PAGE_LAYOUT_TEST_IDS.REQUEST_PROGRESS_BAR
    );
    expect(requestProgressBar).toBeVisible();
    expect(requestProgressBar).toHaveAttribute(
      'aria-valuenow',
      RequestProgressStep.Symptoms.toString()
    );

    const backButton = screen.getByTestId(PAGE_LAYOUT_TEST_IDS.BACK_BUTTON);
    expect(backButton).toBeVisible();
    expect(backButton).toHaveAttribute(
      'href',
      ONLINE_SELF_SCHEDULING_ROUTES.HOME
    );

    const submitButton = screen.getByTestId(FORM_FOOTER_TEST_IDS.SUBMIT_BUTTON);
    expect(submitButton).toBeVisible();
    expect(submitButton).toBeDisabled();

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_SYMPTOM);
  });

  it('should render correctly autocomplete options', async () => {
    const { user } = setup();

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_SYMPTOM);

    const autocompleteFieldCombobox = getAucompleteFieldCombobox();
    expect(autocompleteFieldCombobox).toBeVisible();

    await user.click(autocompleteFieldCombobox);

    const symptomsOptions = await findAllAutocompleteOptions();

    symptomsOptions.forEach((symptomsOption, idx) => {
      expect(symptomsOption).toBeVisible();
      expect(symptomsOption).toHaveTextContent(
        mockStructuredSymptoms[idx].friendly_name
      );
    });
  });

  it('should behave correctly when submitted', async () => {
    const { user } = setup();
    const { result: segmentHook } = renderHook(() => useSegment());
    const mockSymptom = mockStructuredSymptoms[0].friendly_name;

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_SYMPTOM);

    const submitButton = screen.getByTestId(FORM_FOOTER_TEST_IDS.SUBMIT_BUTTON);
    expect(submitButton).toBeVisible();
    expect(submitButton).toBeDisabled();

    const autocompleteFieldCombobox = getAucompleteFieldCombobox();
    expect(autocompleteFieldCombobox).toBeVisible();

    await user.click(autocompleteFieldCombobox);

    const symptomOption = await findAutocompleteOption(mockSymptom);

    expect(symptomOption).toBeVisible();

    await user.click(symptomOption);

    const additionalSymptomsConfirmationRoot =
      await findAdditionalSymptomsConfirmationRoot();
    expect(additionalSymptomsConfirmationRoot).toBeVisible();

    const additionalSymptomsConfirmationCheckboxField =
      getAdditionalSymptomsConfirmationCheckboxField();
    expect(additionalSymptomsConfirmationCheckboxField).toBeVisible();

    const additionalSymptomsConfirmationCheckbox =
      getAdditionalSymptomsConfirmationCheckbox();
    expect(additionalSymptomsConfirmationCheckbox).not.toBeChecked();

    await user.click(additionalSymptomsConfirmationCheckboxField);

    await waitFor(() => {
      expect(additionalSymptomsConfirmationCheckbox).toBeChecked();
    });

    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    await waitFor(() => {
      expect(additionalSymptomsConfirmationCheckbox).toBeChecked();
    });

    await waitFor(() => {
      expect(segmentHook.current.track).toBeCalledWith(
        SEGMENT_EVENTS.SUBMIT_SYMPTOM_DROPDOWN_SELECT,
        {
          [SEGMENT_EVENTS.SUBMIT_SYMPTOM_DROPDOWN_SELECT]: mockSymptom,
        }
      );
    });

    await waitFor(() => {
      expect(segmentHook.current.track).toBeCalledWith(
        SEGMENT_EVENTS.MEDICAL_ATTESTATION_CHECK,
        {
          [SEGMENT_EVENTS.MEDICAL_ATTESTATION_CHECK]: true,
        }
      );
    });

    expect(mockNavigate).toBeCalledWith(
      ONLINE_SELF_SCHEDULING_ROUTES.PREFERRED_TIME
    );
  });

  it('should submit custom symptoms', async () => {
    const customSymptoms = 'My symptoms';
    const { user } = setup();
    const { result: segmentHook } = renderHook(() => useSegment());

    const submitButton = screen.getByTestId(FORM_FOOTER_TEST_IDS.SUBMIT_BUTTON);
    expect(submitButton).toBeVisible();
    expect(submitButton).toBeDisabled();

    const customSymptomsButton = getCustomSymptomsButton();
    await user.click(customSymptomsButton);

    const customSymptomsInput = await findCustomSymptomsInput();
    expect(customSymptomsInput).toBeVisible();

    await user.type(customSymptomsInput, customSymptoms);

    const additionalSymptomsConfirmationCheckboxField =
      getAdditionalSymptomsConfirmationCheckboxField();
    expect(additionalSymptomsConfirmationCheckboxField).toBeVisible();

    const additionalSymptomsConfirmationCheckbox =
      getAdditionalSymptomsConfirmationCheckbox();
    expect(additionalSymptomsConfirmationCheckbox).not.toBeChecked();

    await user.click(additionalSymptomsConfirmationCheckboxField);

    await waitFor(() => {
      expect(additionalSymptomsConfirmationCheckbox).toBeChecked();
    });

    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    await waitFor(() => {
      expect(segmentHook.current.track).toBeCalledWith(
        SEGMENT_EVENTS.SUBMIT_SYMPTOM_INPUT_TEXT,
        {
          [SEGMENT_EVENTS.SUBMIT_SYMPTOM_INPUT_TEXT]: customSymptoms,
        }
      );
    });

    await waitFor(() => {
      expect(segmentHook.current.track).toBeCalledWith(
        SEGMENT_EVENTS.MEDICAL_ATTESTATION_CHECK,
        {
          [SEGMENT_EVENTS.MEDICAL_ATTESTATION_CHECK]: true,
        }
      );
    });

    expect(mockNavigate).toBeCalledWith(
      ONLINE_SELF_SCHEDULING_ROUTES.PREFERRED_TIME
    );
  });
});
