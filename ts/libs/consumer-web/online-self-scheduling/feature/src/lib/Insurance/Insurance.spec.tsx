import { rest } from 'msw';
import type {
  UserEvent,
  Config as UserEventSetupConfig,
} from '@testing-library/user-event/setup/setup';
import {
  INSURANCE_CLASSIFICATION_TEST_IDS,
  QuestionYesNoAnswer,
  InsuranceType,
  FORM_FOOTER_TEST_IDS,
  SELECT_INSURANCE_PROVIDER_MODAL_TEST_IDS,
  SEARCH_NETWORK_FORM_TEST_IDS,
  FORM_HEADER_TEST_IDS,
  RETURNING_PATIENT_INSURANCE_TEST_IDS,
  PAGE_LAYOUT_TEST_IDS,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import {
  render,
  screen,
  waitFor,
  within,
  testSegmentPageView,
  renderHook,
} from '../../testUtils';
import { Insurance } from './Insurance';
import { ONLINE_SELF_SCHEDULING_ROUTES, SEGMENT_EVENTS } from '../constants';
import {
  MANAGE_SELF_SCHEDULE_SLICE_KEY,
  manageSelfScheduleInitialState,
  RelationToPatient,
  mockedInsuranceNetwork,
  mockStates,
  mockedInsuranceNetworksList,
  environment,
  buildInsuranceNetworksPath,
  mockInsurance,
  InsuranceEligibilityStatus,
  mockInsuranceWithEligibleStatus,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import {
  buildPatientAccountCheckEligibilityApiPath,
  buildPatientAccountGetInsurancesApiPath,
  mswServer,
} from '../../testUtils/server';
import { FORM_SELECT_MENU_ITEM_TEST_IDS } from '@*company-data-covered*/shared/ui/forms';
import { insuranceNetworksMock, networkPayersMock } from './mocks';
import { useSegment } from '@*company-data-covered*/segment/feature';

const insuranceNetworksPath = buildInsuranceNetworksPath();

const findInsurancesLoader = () =>
  screen.findByTestId(PAGE_LAYOUT_TEST_IDS.LOADER);

const getInsuranceTypeQuestion = () =>
  screen.getByTestId(INSURANCE_CLASSIFICATION_TEST_IDS.INSURANCE_TYPE_QUESTION);

const getInsuranceThroughCompanyQuestion = () =>
  screen.getByTestId(
    INSURANCE_CLASSIFICATION_TEST_IDS.INSURANCE_THROUGH_COMPANY_QUESTION
  );

const getInsuranceCompanyDetailsQuestion = () =>
  screen.getByTestId(
    INSURANCE_CLASSIFICATION_TEST_IDS.INSURANCE_COMPANY_DETAILS_QUESTION
  );

const getInsuranceStateQuestion = () =>
  screen.getByTestId(
    INSURANCE_CLASSIFICATION_TEST_IDS.INSURANCE_STATE_QUESTION
  );

const getInsuranceTypeRadioOption = (optionValue: InsuranceType) =>
  screen.getByTestId(
    INSURANCE_CLASSIFICATION_TEST_IDS.getInsuranceTypeRadioOption(optionValue)
  );

const getIsPublicInsuranceThroughCompanyRadioOption = (
  optionValue: QuestionYesNoAnswer
) =>
  screen.getByTestId(
    INSURANCE_CLASSIFICATION_TEST_IDS.getIsPublicInsuranceThroughCompanyRadioOption(
      optionValue
    )
  );

const getInsuranceProvidersSearchField = () =>
  screen.getByTestId(
    INSURANCE_CLASSIFICATION_TEST_IDS.INSURANCE_PROVIDERS_SEARCH_FIELD
  );

const getInsuranceProvidersSearchInput = () =>
  screen.getByTestId(SELECT_INSURANCE_PROVIDER_MODAL_TEST_IDS.SEARCH_INSURANCE);

const getInsuranceProviderCloseButton = () =>
  screen.getByTestId(SELECT_INSURANCE_PROVIDER_MODAL_TEST_IDS.CLOSE_MODAL_ICON);

const getStatesSelect = () =>
  screen.getByTestId(INSURANCE_CLASSIFICATION_TEST_IDS.STATES_SELECT);

const findStatesSelectMenuOption = (stateAbbr: string) =>
  screen.findByTestId(
    FORM_SELECT_MENU_ITEM_TEST_IDS.getFormSelectMenuItem(
      INSURANCE_CLASSIFICATION_TEST_IDS.STATES_SELECT_ITEM_PREFIX,
      stateAbbr
    )
  );

const getFormFooterSubmitButton = () =>
  screen.getByTestId(FORM_FOOTER_TEST_IDS.SUBMIT_BUTTON);

const getVerifyInsuranceButton = () =>
  screen.getByTestId(SEARCH_NETWORK_FORM_TEST_IDS.VERIFY_INSURANCE_BUTTON);

const getAddAnotherInsuranceButton = () =>
  screen.getByTestId(SEARCH_NETWORK_FORM_TEST_IDS.ADD_ANOTHER_INSURANCE_BUTTON);

const queryAddAnotherInsuranceButton = () =>
  screen.queryByTestId(
    SEARCH_NETWORK_FORM_TEST_IDS.ADD_ANOTHER_INSURANCE_BUTTON
  );

const getInsuranceEligibilityAlert = () =>
  screen.getByTestId(SEARCH_NETWORK_FORM_TEST_IDS.ALERT);

const findSearchNetworkForm = () =>
  screen.findByTestId(SEARCH_NETWORK_FORM_TEST_IDS.CONTAINER);

const getNetworkSelectButton = () =>
  within(
    screen.getByTestId(SEARCH_NETWORK_FORM_TEST_IDS.NETWORK_SELECT)
  ).getByRole('button');

const getNetworkSelectInput = () =>
  screen.getByTestId(SEARCH_NETWORK_FORM_TEST_IDS.NETWORK_SELECT_INPUT);

const getInsuranceMemberIdInput = () =>
  screen.getByTestId(SEARCH_NETWORK_FORM_TEST_IDS.MEMBER_ID_INPUT);

const findNetworkSelectOption = (networkLabel: string) =>
  screen.findByTestId(
    `${SEARCH_NETWORK_FORM_TEST_IDS.NETWORK_SELECT_ITEM_PREFIX}-${networkLabel}`
  );

const getInsuranceProviderSelectModalContainer = () =>
  screen.getByTestId(SELECT_INSURANCE_PROVIDER_MODAL_TEST_IDS.CONTAINER);

const getRemoveSelectedProviderButton = () =>
  screen.getByTestId(
    SEARCH_NETWORK_FORM_TEST_IDS.REMOVE_SELECTED_INSURANCE_PROVIDER_ICON
  );

const getSelectedProviderSearchNetworkFormInput = () =>
  screen.getByTestId(SEARCH_NETWORK_FORM_TEST_IDS.SELECTED_PROVIDER_INPUT);

const findSelectedProviderSearchNetworkFormInput = () =>
  screen.findByTestId(SEARCH_NETWORK_FORM_TEST_IDS.SELECTED_PROVIDER_INPUT);

const getInsuranceNotInTheListButton = () =>
  screen.getByTestId(
    SELECT_INSURANCE_PROVIDER_MODAL_TEST_IDS.INSURANCE_NOT_IN_THE_LIST
  );

const getInsuranceClassificationTitle = () =>
  screen.getByTestId(FORM_HEADER_TEST_IDS.TITLE);

const getReturningPatientInsuranceTitle = () =>
  screen.getByTestId(RETURNING_PATIENT_INSURANCE_TEST_IDS.TITLE);

const getReturningPatientInsuranceIsSameButton = () =>
  screen.getByTestId(
    RETURNING_PATIENT_INSURANCE_TEST_IDS.INSURANCE_IS_SAME_BUTTON
  );

const getReturningPatientInsuranceHasChangedButton = () =>
  screen.getByTestId(
    RETURNING_PATIENT_INSURANCE_TEST_IDS.INSURANCE_HAS_CHANGED_BUTTON
  );

const findReturningPatientInsuranceTitle = () =>
  screen.findByTestId(RETURNING_PATIENT_INSURANCE_TEST_IDS.TITLE);

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockedInsuranceMemberIdValue = '12345';
const mockSecondaryInsurance: typeof mockInsuranceWithEligibleStatus = {
  ...mockInsuranceWithEligibleStatus,
  id: 2,
  priority: '2',
};

const mockedInsuranceProviderSearchValue = 'G Insurance';

const setup = (userEventOptions: Partial<UserEventSetupConfig> = {}) => {
  return render(<Insurance />, {
    withRouter: true,
    preloadedState: {
      [MANAGE_SELF_SCHEDULE_SLICE_KEY]: {
        ...manageSelfScheduleInitialState,
        data: {
          ...manageSelfScheduleInitialState.data,
          requester: {
            relationToPatient: RelationToPatient.Patient,
          },
        },
      },
    },
    userEventOptions,
  });
};

const mockedInsurancePayer = networkPayersMock[0];

const addInsuranceFlow = async (
  user: UserEvent,
  options?: {
    isSecondaryInsurance?: boolean;
    eligibilityMessage?: string;
  }
) => {
  const { isSecondaryInsurance = false, eligibilityMessage = 'In Network' } =
    options || {};

  const classificationFormTile = getInsuranceClassificationTitle();
  expect(classificationFormTile).toBeVisible();
  expect(classificationFormTile).toHaveTextContent(
    isSecondaryInsurance
      ? 'Secondary insurance'
      : 'Let’s capture your health insurance'
  );

  const employerProvidedOrPrivateInsuranceTypeOption =
    getInsuranceTypeRadioOption(InsuranceType.EmployerProvidedOrPrivate);
  await user.click(employerProvidedOrPrivateInsuranceTypeOption);

  const payersSearchField = getInsuranceProvidersSearchField();
  await user.click(payersSearchField);

  const insurancePayerOption = await screen.findByTestId(
    SELECT_INSURANCE_PROVIDER_MODAL_TEST_IDS.getInsuranceOptionId(
      mockedInsurancePayer.id.toString()
    )
  );
  await user.click(insurancePayerOption);

  const continueButton = getFormFooterSubmitButton();
  await user.click(continueButton);

  const selectNetworkButton = getNetworkSelectButton();
  await user.click(selectNetworkButton);

  const insuranceNetworkOption = await findNetworkSelectOption(
    mockedInsuranceNetwork.id.toString()
  );
  await user.click(insuranceNetworkOption);

  const insuranceMemberIdInput = getInsuranceMemberIdInput();
  await user.type(insuranceMemberIdInput, mockedInsuranceMemberIdValue);

  const verifyInsuranceButton = getVerifyInsuranceButton();
  expect(verifyInsuranceButton).toBeEnabled();
  await user.click(verifyInsuranceButton);

  const insuranceEligibilityAlert = getInsuranceEligibilityAlert();
  await waitFor(() => expect(insuranceEligibilityAlert).toBeVisible());
  expect(insuranceEligibilityAlert).toHaveTextContent(eligibilityMessage);
};

describe('<Insurance />', () => {
  describe('Payer auto-select when offered through state', () => {
    beforeEach(() => {
      mswServer.use(
        rest.post(
          `${environment.serviceURL}${insuranceNetworksPath}`,
          (_req, res, ctx) => {
            return res.once(
              ctx.status(200),
              ctx.json({ data: insuranceNetworksMock })
            );
          }
        )
      );
    });

    it.each([
      {
        publicInsuranceType: InsuranceType.Medicaid,
        expectedPayer: networkPayersMock[0],
        selectedStateAbbr: mockStates[0].abbreviation,
      },
      {
        publicInsuranceType: InsuranceType.Medicare,
        expectedPayer: networkPayersMock[2],
        selectedStateAbbr: mockStates[0].abbreviation,
      },
    ])(
      `should render the selected Payer after user selected that he has public $publicInsuranceType insurance offered through state and clicked continue`,
      async ({ publicInsuranceType, expectedPayer, selectedStateAbbr }) => {
        const { user } = setup();

        const loader = await findInsurancesLoader();
        await waitFor(() => expect(loader).not.toBeInTheDocument());

        const publicInsuranceTypeOption =
          getInsuranceTypeRadioOption(publicInsuranceType);
        await user.click(publicInsuranceTypeOption);

        const isPublicInsuranceThroughCompanyNoOption =
          getIsPublicInsuranceThroughCompanyRadioOption(QuestionYesNoAnswer.No);
        await user.click(isPublicInsuranceThroughCompanyNoOption);

        const statesSelect = getStatesSelect();

        const statesSelectButton = within(statesSelect).getByRole('button');
        await user.click(statesSelectButton);

        const coloradoStateOption = await findStatesSelectMenuOption(
          selectedStateAbbr
        );
        await user.click(coloradoStateOption);

        const continueButton = getFormFooterSubmitButton();
        await user.click(continueButton);

        const insuranceProviderSelect =
          await findSelectedProviderSearchNetworkFormInput();
        expect(insuranceProviderSelect).toBeVisible();
        expect(insuranceProviderSelect).toHaveDisplayValue(expectedPayer.name);

        const networkSelectInput = screen.queryByTestId(
          SEARCH_NETWORK_FORM_TEST_IDS.NETWORK_SELECT_INPUT
        );
        expect(networkSelectInput).not.toBeInTheDocument();
      }
    );
  });

  describe('should render correctly: user selected public insurance', () => {
    it.each([
      {
        publicInsurance: InsuranceType.Medicaid,
      },
      {
        publicInsurance: InsuranceType.Medicare,
      },
    ])('$publicInsurance', async ({ publicInsurance }) => {
      const { user } = setup();

      const loader = await findInsurancesLoader();
      await waitFor(() => expect(loader).not.toBeInTheDocument());

      await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_INSURANCE);

      const insuranceTypeQuestion = getInsuranceTypeQuestion();

      expect(insuranceTypeQuestion).toBeVisible();
      expect(insuranceTypeQuestion).toHaveTextContent(
        'What type of insurance do you have?'
      );

      const insuranceTypeValues = Object.values(InsuranceType);

      for (const insuranceType of insuranceTypeValues) {
        const radioOption = getInsuranceTypeRadioOption(insuranceType);
        expect(radioOption).toBeVisible();
        expect(radioOption).not.toBeChecked();
      }

      const publicInsuranceRadioOption =
        getInsuranceTypeRadioOption(publicInsurance);
      await user.click(publicInsuranceRadioOption);

      const insuranceThroughCompanyQuestion =
        getInsuranceThroughCompanyQuestion();
      expect(insuranceThroughCompanyQuestion).toBeVisible();
      expect(insuranceThroughCompanyQuestion).toHaveTextContent(
        `Is your ${publicInsurance} administered through an insurance company? (for example, Blue Cross Blue Shield or Humana)`
      );

      const publicInsuranceThroughCompanyYesOption =
        getIsPublicInsuranceThroughCompanyRadioOption(QuestionYesNoAnswer.Yes);
      expect(publicInsuranceThroughCompanyYesOption).toBeVisible();
      expect(publicInsuranceThroughCompanyYesOption).not.toBeChecked();

      const publicInsuranceThroughCompanyNoOption =
        getIsPublicInsuranceThroughCompanyRadioOption(QuestionYesNoAnswer.No);
      expect(publicInsuranceThroughCompanyNoOption).toBeVisible();
      expect(publicInsuranceThroughCompanyNoOption).not.toBeChecked();

      await user.click(publicInsuranceThroughCompanyNoOption);

      const insuranceStateQuestion = getInsuranceStateQuestion();
      expect(insuranceStateQuestion).toBeVisible();
      expect(insuranceStateQuestion).toHaveTextContent(
        `What state is your ${publicInsurance} offered through?`
      );

      const statesSelect = getStatesSelect();
      expect(statesSelect).toBeVisible();

      await user.click(publicInsuranceThroughCompanyYesOption);

      const insuranceThroughCompanyDetailsQuestion =
        getInsuranceCompanyDetailsQuestion();
      expect(insuranceThroughCompanyDetailsQuestion).toBeVisible();
      expect(insuranceThroughCompanyQuestion).toHaveTextContent(
        `Is your ${publicInsurance} administered through an insurance company? (for example, Blue Cross Blue Shield or Humana)`
      );
      const insuranceProvidersSearchField = getInsuranceProvidersSearchField();
      expect(insuranceProvidersSearchField).toBeVisible();
    });
  });

  it('should render correctly: user selected employer provided or private insurance', async () => {
    const { user } = setup();

    const loader = await findInsurancesLoader();
    await waitFor(() => expect(loader).not.toBeInTheDocument());

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_INSURANCE);

    const employerProvidedInsuranceRadioOption = getInsuranceTypeRadioOption(
      InsuranceType.EmployerProvidedOrPrivate
    );
    await user.click(employerProvidedInsuranceRadioOption);

    const insuranceProvidersSearchField = getInsuranceProvidersSearchField();
    expect(insuranceProvidersSearchField).toBeVisible();
  });

  it("should render correctly: user selected 'i don't have insurance'", async () => {
    const { user } = setup();

    const loader = await findInsurancesLoader();
    await waitFor(() => expect(loader).not.toBeInTheDocument());

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_INSURANCE);

    const uninsuredRadioOption = getInsuranceTypeRadioOption(
      InsuranceType.None
    );
    await user.click(uninsuredRadioOption);

    const submitButton = getFormFooterSubmitButton();
    expect(submitButton).toBeVisible();

    await user.click(submitButton);
    expect(mockNavigate).toBeCalledWith(
      ONLINE_SELF_SCHEDULING_ROUTES.CONFIRM_DETAILS
    );
  });

  it('should display insurance provider select modal, when clicked on search input', async () => {
    const { user } = setup();

    const loader = await findInsurancesLoader();
    await waitFor(() => expect(loader).not.toBeInTheDocument());

    const employerOrPrivateOption = getInsuranceTypeRadioOption(
      InsuranceType.EmployerProvidedOrPrivate
    );
    await user.click(employerOrPrivateOption);

    const providersSearchField = getInsuranceProvidersSearchField();
    await user.click(providersSearchField);

    const providerSelectModal = getInsuranceProviderSelectModalContainer();
    expect(providerSelectModal).toBeVisible();
  });

  it('should reset provider search input, when re-opened SelectInsuranceProviderModal', async () => {
    mswServer.use(
      rest.post(
        `${environment.serviceURL}${insuranceNetworksPath}`,
        (_req, res, ctx) => {
          return res.once(
            ctx.status(200),
            ctx.json({ data: insuranceNetworksMock })
          );
        }
      )
    );

    const { user } = setup({ delay: null });
    const targetProvider = insuranceNetworksMock[0].insurancePayerName[0];

    const loader = await findInsurancesLoader();
    await waitFor(() => expect(loader).not.toBeInTheDocument());

    const employerOrPrivateOption = getInsuranceTypeRadioOption(
      InsuranceType.EmployerProvidedOrPrivate
    );
    await user.click(employerOrPrivateOption);

    const providersSearchField = getInsuranceProvidersSearchField();
    await user.click(providersSearchField);

    const providersSearchInput = getInsuranceProvidersSearchInput();
    await user.type(providersSearchInput, mockedInsuranceProviderSearchValue);

    const providerListItem = screen.queryByTestId(
      SELECT_INSURANCE_PROVIDER_MODAL_TEST_IDS.getSectionCharacter(
        targetProvider
      )
    );
    await waitFor(() => {
      expect(providerListItem).not.toBeInTheDocument();
    });

    const selectProviderModalCloseButton = getInsuranceProviderCloseButton();
    await user.click(selectProviderModalCloseButton);

    await user.click(providersSearchField);

    const providerListItemNew = screen.queryByTestId(
      SELECT_INSURANCE_PROVIDER_MODAL_TEST_IDS.getSectionCharacter(
        targetProvider
      )
    );

    await waitFor(() => {
      expect(providerListItemNew).toBeInTheDocument();
    });
  });

  it('should pick an insurance provider in the select modal, when clicked on one in the list', async () => {
    const { user } = setup();

    const loader = await findInsurancesLoader();
    await waitFor(() => expect(loader).not.toBeInTheDocument());

    const employerOrPrivateOption = getInsuranceTypeRadioOption(
      InsuranceType.EmployerProvidedOrPrivate
    );
    await user.click(employerOrPrivateOption);

    const providersSearchField = getInsuranceProvidersSearchField();
    await user.click(providersSearchField);

    const providerListItem = screen.getByTestId(
      SELECT_INSURANCE_PROVIDER_MODAL_TEST_IDS.getSectionCharacter(
        mockedInsuranceNetworksList[0].insurancePayerName[0]
      )
    );
    expect(providerListItem).toBeVisible();

    const providerListItemOption = screen.getByTestId(
      SELECT_INSURANCE_PROVIDER_MODAL_TEST_IDS.getInsuranceOptionId(
        mockedInsuranceNetworksList[0].insurancePayerId.toString()
      )
    );
    expect(providerListItemOption).toBeVisible();
    await user.click(providerListItemOption);

    await waitFor(() =>
      expect(within(providersSearchField).getByRole('textbox')).toHaveValue(
        mockedInsuranceNetworksList[0].insurancePayerName
      )
    );
  });

  it('should remove insurance provider, reset insurance data and display insurance questions screen when pressed remove button', async () => {
    const { user } = setup();

    const loader = await findInsurancesLoader();
    await waitFor(() => expect(loader).not.toBeInTheDocument());

    const employerOrPrivateOption = getInsuranceTypeRadioOption(
      InsuranceType.EmployerProvidedOrPrivate
    );
    await user.click(employerOrPrivateOption);

    const providersSearchField = getInsuranceProvidersSearchField();
    await user.click(providersSearchField);

    const providerListItem = screen.getByTestId(
      SELECT_INSURANCE_PROVIDER_MODAL_TEST_IDS.getSectionCharacter(
        mockedInsuranceNetworksList[0].insurancePayerName[0]
      )
    );
    expect(providerListItem).toBeVisible();

    const providerListItemOption = screen.getByTestId(
      SELECT_INSURANCE_PROVIDER_MODAL_TEST_IDS.getInsuranceOptionId(
        mockedInsuranceNetworksList[0].insurancePayerId.toString()
      )
    );
    expect(providerListItemOption).toBeVisible();
    await user.click(providerListItemOption);

    await waitFor(() =>
      expect(within(providersSearchField).getByRole('textbox')).toHaveValue(
        mockedInsuranceNetworksList[0].insurancePayerName
      )
    );

    const submitButton = getFormFooterSubmitButton();
    await user.click(submitButton);

    const removeSelectedProviderButton = getRemoveSelectedProviderButton();
    await user.click(removeSelectedProviderButton);

    expect(removeSelectedProviderButton).not.toBeVisible();

    const insuranceTypeQuestion = getInsuranceTypeQuestion();
    expect(insuranceTypeQuestion).toBeVisible();
    expect(insuranceTypeQuestion).toHaveTextContent(
      'What type of insurance do you have?'
    );
  });

  it('should navigate to confirm details page when clicked on "My insurance is not on this list" button for new patient', async () => {
    const { user } = setup();

    const loader = await findInsurancesLoader();
    await waitFor(() => expect(loader).not.toBeInTheDocument());

    const employerOrPrivateOption = getInsuranceTypeRadioOption(
      InsuranceType.EmployerProvidedOrPrivate
    );
    await user.click(employerOrPrivateOption);

    const providersSearchField = getInsuranceProvidersSearchField();
    await user.click(providersSearchField);

    const notOnThisListButton = getInsuranceNotInTheListButton();
    await user.click(notOnThisListButton);

    expect(mockNavigate).toBeCalledWith(
      ONLINE_SELF_SCHEDULING_ROUTES.CONFIRM_DETAILS
    );
  });

  it("should render the selected Payer and the 'Verify Insurance' button should be disabled", async () => {
    const { user } = setup();

    const loader = await findInsurancesLoader();
    await waitFor(() => expect(loader).not.toBeInTheDocument());

    const employerProvidedOrPrivateInsuranceTypeOption =
      getInsuranceTypeRadioOption(InsuranceType.EmployerProvidedOrPrivate);
    await user.click(employerProvidedOrPrivateInsuranceTypeOption);

    const payersSearchField = getInsuranceProvidersSearchField();
    expect(payersSearchField).toBeVisible();
    await user.click(payersSearchField);

    const insurancePayerOption = await screen.findByTestId(
      SELECT_INSURANCE_PROVIDER_MODAL_TEST_IDS.getInsuranceOptionId(
        mockedInsuranceNetworksList[0].insurancePayerId.toString()
      )
    );
    await user.click(insurancePayerOption);

    const continueButton = getFormFooterSubmitButton();
    await user.click(continueButton);

    const searchNetworkForm = await findSearchNetworkForm();
    expect(searchNetworkForm).toBeVisible();

    const selectedInsurancePayerInput =
      getSelectedProviderSearchNetworkFormInput();
    expect(selectedInsurancePayerInput).toHaveValue(
      mockedInsuranceNetworksList[0].insurancePayerName
    );

    const verifyInsuranceButton = getVerifyInsuranceButton();
    expect(verifyInsuranceButton).toBeDisabled();
  });

  it('should change network select and a member ID values', async () => {
    const { user } = setup();

    const loader = await findInsurancesLoader();
    await waitFor(() => expect(loader).not.toBeInTheDocument());
    const mockedInsuranceNetworkId = mockedInsuranceNetwork.id.toString();

    const employerProvidedOrPrivateInsuranceTypeOption =
      getInsuranceTypeRadioOption(InsuranceType.EmployerProvidedOrPrivate);
    await user.click(employerProvidedOrPrivateInsuranceTypeOption);

    const payersSearchField = getInsuranceProvidersSearchField();
    await user.click(payersSearchField);

    const insurancePayerOption = await screen.findByTestId(
      SELECT_INSURANCE_PROVIDER_MODAL_TEST_IDS.getInsuranceOptionId(
        mockedInsuranceNetworksList[0].insurancePayerId.toString()
      )
    );
    await user.click(insurancePayerOption);

    const continueButton = getFormFooterSubmitButton();
    await user.click(continueButton);

    const searchNetworkForm = await findSearchNetworkForm();
    expect(searchNetworkForm).toBeVisible();

    const selectedInsurancePayerInput =
      getSelectedProviderSearchNetworkFormInput();
    expect(selectedInsurancePayerInput).toHaveValue(
      mockedInsuranceNetworksList[0].insurancePayerName
    );

    const selectNetworkInput = getNetworkSelectInput();
    expect(selectNetworkInput).toHaveValue('');
    const verifyInsuranceButton = getVerifyInsuranceButton();
    expect(verifyInsuranceButton).toBeDisabled();

    const selectNetworkButton = getNetworkSelectButton();
    await user.click(selectNetworkButton);

    const insuranceNetworkOption = await findNetworkSelectOption(
      mockedInsuranceNetwork.id.toString()
    );
    expect(insuranceNetworkOption).toBeVisible();
    expect(insuranceNetworkOption).toHaveTextContent(
      mockedInsuranceNetwork.name
    );
    await user.click(insuranceNetworkOption);

    expect(selectNetworkInput).toHaveValue(mockedInsuranceNetworkId);

    const insuranceMemberIdInput = getInsuranceMemberIdInput();
    expect(insuranceMemberIdInput).toHaveValue('');
    await user.type(insuranceMemberIdInput, mockedInsuranceMemberIdValue);
    expect(insuranceMemberIdInput).toHaveValue(mockedInsuranceMemberIdValue);

    expect(verifyInsuranceButton).toBeEnabled();
  });

  it('should auto-select the network and hide network select if there is only one network', async () => {
    mswServer.use(
      rest.post(
        `${environment.serviceURL}${insuranceNetworksPath}`,
        (_req, res, ctx) => {
          return res.once(
            ctx.status(200),
            ctx.json({ data: [mockedInsuranceNetwork] })
          );
        }
      )
    );

    const { user } = setup();

    const loader = await findInsurancesLoader();
    await waitFor(() => expect(loader).not.toBeInTheDocument());

    const employerProvidedOrPrivateInsuranceTypeOption =
      getInsuranceTypeRadioOption(InsuranceType.EmployerProvidedOrPrivate);
    await user.click(employerProvidedOrPrivateInsuranceTypeOption);

    const payersSearchField = getInsuranceProvidersSearchField();
    await user.click(payersSearchField);

    const insurancePayerOption = await screen.findByTestId(
      SELECT_INSURANCE_PROVIDER_MODAL_TEST_IDS.getInsuranceOptionId(
        mockedInsuranceNetworksList[0].insurancePayerId.toString()
      )
    );
    await user.click(insurancePayerOption);

    const continueButton = getFormFooterSubmitButton();
    await user.click(continueButton);

    const selectedInsurancePayerInput =
      getSelectedProviderSearchNetworkFormInput();
    expect(selectedInsurancePayerInput).toHaveValue(
      mockedInsuranceNetworksList[0].insurancePayerName
    );

    const selectNetworkButton = screen.queryByTestId(
      SEARCH_NETWORK_FORM_TEST_IDS.NETWORK_SELECT_INPUT
    );
    expect(selectNetworkButton).not.toBeInTheDocument();
  });

  it.each([
    {
      eligibilityStatus: InsuranceEligibilityStatus.Eligible,
      alertTitle: 'In Network',
    },
    {
      eligibilityStatus: InsuranceEligibilityStatus.Ineligible,
      alertTitle: 'Out of Network',
    },
    {
      eligibilityStatus: InsuranceEligibilityStatus.Unverified,
      alertTitle: 'In Network',
    },
  ])(
    'should show $alertTitle alert, Add another insurance button and Continue button for insurance with $eligibilityStatus status',
    async ({ eligibilityStatus, alertTitle }) => {
      mswServer.use(
        rest.post(
          buildPatientAccountCheckEligibilityApiPath(),
          (_req, res, ctx) => {
            return res.once(
              ctx.status(200),
              ctx.json({
                data: {
                  ...mockInsurance,
                  eligible: eligibilityStatus,
                },
              })
            );
          }
        )
      );

      const { user } = setup();

      const loader = await findInsurancesLoader();
      await waitFor(() => expect(loader).not.toBeInTheDocument());

      await addInsuranceFlow(user, { eligibilityMessage: alertTitle });

      const addAnotherInsuranceButton = getAddAnotherInsuranceButton();
      expect(addAnotherInsuranceButton).toBeVisible();
      expect(addAnotherInsuranceButton).toBeEnabled();

      const continueToConfirmDetailsButton = getFormFooterSubmitButton();
      expect(continueToConfirmDetailsButton).toBeVisible();
      expect(continueToConfirmDetailsButton).toBeEnabled();
    }
  );

  it('should show Re-Verify insurance button with Out of Network alert for insurance with ineligible status', async () => {
    mswServer.use(
      rest.post(
        buildPatientAccountCheckEligibilityApiPath(),
        (_req, res, ctx) => {
          return res.once(
            ctx.status(200),
            ctx.json({
              data: {
                ...mockInsurance,
                eligible: InsuranceEligibilityStatus.Ineligible,
              },
            })
          );
        }
      )
    );

    const { user } = setup();

    const loader = await findInsurancesLoader();
    await waitFor(() => expect(loader).not.toBeInTheDocument());

    await addInsuranceFlow(user, { eligibilityMessage: 'Out of Network' });

    const verifyInsuranceButton = getVerifyInsuranceButton();
    expect(verifyInsuranceButton).toBeVisible();
    expect(verifyInsuranceButton).toBeEnabled();
    expect(verifyInsuranceButton).toHaveTextContent('Re-Verify Insurance');
  });

  it('should navigate to confirm details page when clicked on continue to confirm details button', async () => {
    const { user } = setup();

    const loader = await findInsurancesLoader();
    await waitFor(() => expect(loader).not.toBeInTheDocument());

    await addInsuranceFlow(user);

    const continueToConfirmDetailsButton = getFormFooterSubmitButton();
    await user.click(continueToConfirmDetailsButton);

    expect(mockNavigate).toBeCalledWith(
      ONLINE_SELF_SCHEDULING_ROUTES.CONFIRM_DETAILS
    );
  });

  it('should add secondary insurance', async () => {
    const { user } = setup();

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_INSURANCE);

    await addInsuranceFlow(user);

    const addAnotherInsuranceButton = getAddAnotherInsuranceButton();
    expect(addAnotherInsuranceButton).toBeVisible();
    expect(addAnotherInsuranceButton).toBeEnabled();

    await user.click(addAnotherInsuranceButton);

    await addInsuranceFlow(user, { isSecondaryInsurance: true });

    expect(queryAddAnotherInsuranceButton()).not.toBeInTheDocument();
  });

  it("should display question regarding patient's primary insurance and buttons with answers to verify whether has insurance changed", async () => {
    mswServer.use(
      rest.get(buildPatientAccountGetInsurancesApiPath(), (_req, res, ctx) => {
        return res.once(
          ctx.status(200),
          ctx.json({
            data: [mockInsuranceWithEligibleStatus],
          })
        );
      })
    );

    setup();

    const loader = await findInsurancesLoader();
    await waitFor(() => expect(loader).not.toBeInTheDocument());

    const returningPatientPrimaryInsuranceTitle =
      getReturningPatientInsuranceTitle();
    expect(returningPatientPrimaryInsuranceTitle).toBeVisible();
    expect(returningPatientPrimaryInsuranceTitle).toHaveTextContent(
      'Do you have the same primary insurance?'
    );

    const returningPatientPrimaryInsuranceIsSameButton =
      getReturningPatientInsuranceIsSameButton();
    expect(returningPatientPrimaryInsuranceIsSameButton).toBeVisible();
    expect(returningPatientPrimaryInsuranceIsSameButton).toBeEnabled();
    expect(returningPatientPrimaryInsuranceIsSameButton).toHaveTextContent(
      'Yes, my insurance is the same'
    );

    const returningPatientPrimaryInsuranceHasChangedButton =
      getReturningPatientInsuranceHasChangedButton();
    expect(returningPatientPrimaryInsuranceHasChangedButton).toBeVisible();
    expect(returningPatientPrimaryInsuranceHasChangedButton).toBeEnabled();
    expect(returningPatientPrimaryInsuranceHasChangedButton).toHaveTextContent(
      'No, my insurance has changed'
    );
  });

  it("should display question regarding patient's secondary insurance and buttons with answers to verify whether has secondary insurance changed if the patient has two insurances and primary is the same", async () => {
    mswServer.use(
      rest.get(buildPatientAccountGetInsurancesApiPath(), (_req, res, ctx) => {
        return res.once(
          ctx.status(200),
          ctx.json({
            data: [mockInsuranceWithEligibleStatus, mockSecondaryInsurance],
          })
        );
      })
    );

    const { user } = setup();

    const loader = await findInsurancesLoader();
    await waitFor(() => expect(loader).not.toBeInTheDocument());

    const returningPatientPrimaryInsuranceIsSameButton =
      getReturningPatientInsuranceIsSameButton();
    await user.click(returningPatientPrimaryInsuranceIsSameButton);

    const returningPatientSecondaryInsuranceTitle =
      getReturningPatientInsuranceTitle();
    expect(returningPatientSecondaryInsuranceTitle).toBeVisible();
    expect(returningPatientSecondaryInsuranceTitle).toHaveTextContent(
      'Do you have the same secondary insurance?'
    );

    const returningPatientSecondaryInsuranceIsSameButton =
      getReturningPatientInsuranceIsSameButton();
    expect(returningPatientSecondaryInsuranceIsSameButton).toBeVisible();
    expect(returningPatientSecondaryInsuranceIsSameButton).toBeEnabled();
    expect(returningPatientSecondaryInsuranceIsSameButton).toHaveTextContent(
      'Yes, my insurance is the same'
    );

    const returningPatientSecondaryInsuranceHasChangedButton =
      getReturningPatientInsuranceHasChangedButton();
    expect(returningPatientSecondaryInsuranceHasChangedButton).toBeVisible();
    expect(returningPatientSecondaryInsuranceHasChangedButton).toBeEnabled();
    expect(
      returningPatientSecondaryInsuranceHasChangedButton
    ).toHaveTextContent('No, my insurance has changed');
  });

  it("should navigate to confirm details page when clicked isSame button for patient's secondary insurance if the patient has two insurances", async () => {
    mswServer.use(
      rest.get(buildPatientAccountGetInsurancesApiPath(), (_req, res, ctx) => {
        return res.once(
          ctx.status(200),
          ctx.json({
            data: [mockInsuranceWithEligibleStatus, mockSecondaryInsurance],
          })
        );
      })
    );

    const { user } = setup();

    const loader = await findInsurancesLoader();
    await waitFor(() => expect(loader).not.toBeInTheDocument());

    const returningPatientPrimaryInsuranceIsSameButton =
      getReturningPatientInsuranceIsSameButton();
    await user.click(returningPatientPrimaryInsuranceIsSameButton);

    const returningPatientSecondaryInsuranceIsSameButton =
      getReturningPatientInsuranceIsSameButton();
    await user.click(returningPatientSecondaryInsuranceIsSameButton);

    expect(mockNavigate).toBeCalledWith(
      ONLINE_SELF_SCHEDULING_ROUTES.CONFIRM_DETAILS
    );
  });

  it('should behave correctly for returning patient with two insurances', async () => {
    mswServer.use(
      rest.get(buildPatientAccountGetInsurancesApiPath(), (_req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            data: [mockInsurance, mockSecondaryInsurance],
          })
        );
      })
    );

    const { user } = setup();

    const loader = await findInsurancesLoader();
    await waitFor(() => expect(loader).not.toBeInTheDocument());

    const returningPatientPrimaryInsuranceHasChangedButton =
      getReturningPatientInsuranceHasChangedButton();
    await user.click(returningPatientPrimaryInsuranceHasChangedButton);
    const searchNetworkForm = await findSearchNetworkForm();
    expect(searchNetworkForm).toBeVisible();

    const selectNetworkInput = getNetworkSelectInput();
    expect(selectNetworkInput).toHaveValue(
      mockInsurance.insuranceNetwork.id.toString()
    );

    const selectNetworkButton = getNetworkSelectButton();
    await user.click(selectNetworkButton);

    const insuranceNetworkOption = await findNetworkSelectOption(
      mockedInsuranceNetwork.id.toString()
    );
    expect(insuranceNetworkOption).toHaveTextContent(
      mockedInsuranceNetwork.name
    );
    await user.click(insuranceNetworkOption);

    expect(selectNetworkInput).toHaveValue(
      mockedInsuranceNetwork.id.toString()
    );

    const insuranceMemberIdInput = getInsuranceMemberIdInput();
    expect(insuranceMemberIdInput).toHaveValue(
      mockInsuranceWithEligibleStatus.memberId.toString()
    );
    await user.clear(insuranceMemberIdInput);
    await user.type(insuranceMemberIdInput, mockedInsuranceMemberIdValue);
    expect(insuranceMemberIdInput).toHaveValue(mockedInsuranceMemberIdValue);

    const verifyInsuranceButton = getVerifyInsuranceButton();
    expect(verifyInsuranceButton).toBeEnabled();
    await user.click(verifyInsuranceButton);

    const insuranceEligibilityAlert = getInsuranceEligibilityAlert();
    await waitFor(() => expect(insuranceEligibilityAlert).toBeVisible());

    const addAnotherInsuranceButton = screen.queryByTestId(
      SEARCH_NETWORK_FORM_TEST_IDS.ADD_ANOTHER_INSURANCE_BUTTON
    );
    expect(addAnotherInsuranceButton).not.toBeInTheDocument();

    const continueButton = getFormFooterSubmitButton();
    expect(continueButton).toBeVisible();
    expect(continueButton).toBeEnabled();
    await user.click(continueButton);

    const returningPatientSecondaryInsuranceTitle =
      getReturningPatientInsuranceTitle();
    expect(returningPatientSecondaryInsuranceTitle).toBeVisible();
    expect(returningPatientSecondaryInsuranceTitle).toHaveTextContent(
      'Do you have the same secondary insurance?'
    );
  });

  it("user should be able to change prepopulated primary insurance data and update primary insurance via clicking on 'Verify Insurance' button", async () => {
    mswServer.use(
      rest.get(buildPatientAccountGetInsurancesApiPath(), (_req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            data: [mockInsuranceWithEligibleStatus],
          })
        );
      })
    );

    const { user } = setup();

    const loader = await findInsurancesLoader();
    await waitFor(() => expect(loader).not.toBeInTheDocument());

    const returningPatientPrimaryInsuranceHasChangedButton =
      getReturningPatientInsuranceHasChangedButton();
    await user.click(returningPatientPrimaryInsuranceHasChangedButton);

    const searchNetworkForm = await findSearchNetworkForm();
    expect(searchNetworkForm).toBeVisible();

    const selectedInsurancePayerInput =
      getSelectedProviderSearchNetworkFormInput();
    expect(selectedInsurancePayerInput).toHaveValue(
      mockedInsuranceNetworksList[0].insurancePayerName
    );

    const selectNetworkInput = getNetworkSelectInput();
    expect(selectNetworkInput).toHaveValue(
      mockInsuranceWithEligibleStatus.insuranceNetwork.id.toString()
    );

    const selectNetworkButton = getNetworkSelectButton();
    await user.click(selectNetworkButton);

    const insuranceNetworkOption = await findNetworkSelectOption(
      mockedInsuranceNetwork.id.toString()
    );
    expect(insuranceNetworkOption).toHaveTextContent(
      mockedInsuranceNetwork.name
    );
    await user.click(insuranceNetworkOption);

    expect(selectNetworkInput).toHaveValue(
      mockedInsuranceNetwork.id.toString()
    );

    const insuranceMemberIdInput = getInsuranceMemberIdInput();
    expect(insuranceMemberIdInput).toHaveValue(
      mockInsuranceWithEligibleStatus.memberId.toString()
    );
    await user.clear(insuranceMemberIdInput);
    await user.type(insuranceMemberIdInput, mockedInsuranceMemberIdValue);
    expect(insuranceMemberIdInput).toHaveValue(mockedInsuranceMemberIdValue);

    const verifyInsuranceButton = getVerifyInsuranceButton();
    expect(verifyInsuranceButton).toBeEnabled();
    await user.click(verifyInsuranceButton);

    const insuranceEligibilityAlert = getInsuranceEligibilityAlert();
    await waitFor(() => expect(insuranceEligibilityAlert).toBeVisible());
    expect(insuranceEligibilityAlert).toHaveTextContent('In Network');

    const addAnotherInsuranceButton = getAddAnotherInsuranceButton();
    expect(addAnotherInsuranceButton).toBeVisible();
    expect(addAnotherInsuranceButton).toBeEnabled();

    const continueToConfirmDetailsButton = getFormFooterSubmitButton();
    expect(continueToConfirmDetailsButton).toBeVisible();
    expect(continueToConfirmDetailsButton).toBeEnabled();
  });

  it("should delete the returning patient's primary insurance and navigate to confirm details page when clicked on 'My insurance is not on this list' button", async () => {
    mswServer.use(
      rest.get(buildPatientAccountGetInsurancesApiPath(), (_req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            data: [mockInsurance],
          })
        );
      })
    );

    const { user } = setup();

    const loader = await findInsurancesLoader();
    await waitFor(() => expect(loader).not.toBeInTheDocument());

    const returningPatientPrimaryInsuranceHasChangedButton =
      getReturningPatientInsuranceHasChangedButton();
    await user.click(returningPatientPrimaryInsuranceHasChangedButton);

    const searchNetworkForm = await findSearchNetworkForm();
    expect(searchNetworkForm).toBeVisible();

    const selectedInsurancePayerInput =
      getSelectedProviderSearchNetworkFormInput();
    expect(selectedInsurancePayerInput).toHaveValue(
      mockInsurance.insuranceNetwork.insurancePayerName
    );
    await user.click(selectedInsurancePayerInput);

    const notOnThisListButton = getInsuranceNotInTheListButton();
    await user.click(notOnThisListButton);

    await waitFor(() => {
      expect(mockNavigate).toBeCalledWith(
        ONLINE_SELF_SCHEDULING_ROUTES.CONFIRM_DETAILS
      );
    });
  });

  it("should delete the returning patient's (with two insurances) primary insurance and display secondary insurance flow when clicked on 'My insurance is not on this list' button", async () => {
    mswServer.use(
      rest.get(buildPatientAccountGetInsurancesApiPath(), (_req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            data: [mockInsurance, mockSecondaryInsurance],
          })
        );
      })
    );

    const { user } = setup();

    const loader = await findInsurancesLoader();
    await waitFor(() => expect(loader).not.toBeInTheDocument());

    const returningPatientPrimaryInsuranceHasChangedButton =
      getReturningPatientInsuranceHasChangedButton();
    await user.click(returningPatientPrimaryInsuranceHasChangedButton);

    const searchNetworkForm = await findSearchNetworkForm();
    expect(searchNetworkForm).toBeVisible();

    const selectedInsurancePayerInput =
      getSelectedProviderSearchNetworkFormInput();
    expect(selectedInsurancePayerInput).toHaveValue(
      mockInsurance.insuranceNetwork.insurancePayerName
    );
    await user.click(selectedInsurancePayerInput);

    const notOnThisListButton = getInsuranceNotInTheListButton();
    await user.click(notOnThisListButton);

    const returningPatientSecondaryInsuranceTitle =
      await findReturningPatientInsuranceTitle();
    expect(returningPatientSecondaryInsuranceTitle).toBeVisible();
    expect(returningPatientSecondaryInsuranceTitle).toHaveTextContent(
      'Do you have the same secondary insurance?'
    );
  });

  it("should delete the returning patient's primary insurance and navigate to confirm details page when selected 'I don't have insurance' and clicked on 'Continue' button", async () => {
    mswServer.use(
      rest.get(buildPatientAccountGetInsurancesApiPath(), (_req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            data: [mockInsurance],
          })
        );
      })
    );

    const { user } = setup();

    const loader = await findInsurancesLoader();
    await waitFor(() => expect(loader).not.toBeInTheDocument());

    const returningPatientPrimaryInsuranceHasChangedButton =
      getReturningPatientInsuranceHasChangedButton();
    await user.click(returningPatientPrimaryInsuranceHasChangedButton);

    const searchNetworkForm = await findSearchNetworkForm();
    expect(searchNetworkForm).toBeVisible();

    const removeSelectedProviderButton = getRemoveSelectedProviderButton();
    await user.click(removeSelectedProviderButton);

    const doNotHaveInsuranceOption = getInsuranceTypeRadioOption(
      InsuranceType.None
    );
    await user.click(doNotHaveInsuranceOption);

    const continueButton = getFormFooterSubmitButton();
    expect(continueButton).toBeVisible();
    await user.click(continueButton);

    await waitFor(() => {
      expect(mockNavigate).toBeCalledWith(
        ONLINE_SELF_SCHEDULING_ROUTES.CONFIRM_DETAILS
      );
    });
  });

  it("should delete the returning patient's (with two insurances) primary insurance and display secondary insurance flow when selected 'I don't have insurance' and clicked on 'Continue' button", async () => {
    mswServer.use(
      rest.get(buildPatientAccountGetInsurancesApiPath(), (_req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            data: [mockInsurance, mockSecondaryInsurance],
          })
        );
      })
    );

    const { user } = setup();

    const loader = await findInsurancesLoader();
    await waitFor(() => expect(loader).not.toBeInTheDocument());

    const returningPatientPrimaryInsuranceHasChangedButton =
      getReturningPatientInsuranceHasChangedButton();
    await user.click(returningPatientPrimaryInsuranceHasChangedButton);

    const searchNetworkForm = await findSearchNetworkForm();
    expect(searchNetworkForm).toBeVisible();

    const removeSelectedProviderButton = getRemoveSelectedProviderButton();
    await user.click(removeSelectedProviderButton);

    const doNotHaveInsuranceOption = getInsuranceTypeRadioOption(
      InsuranceType.None
    );
    await user.click(doNotHaveInsuranceOption);

    const continueButton = getFormFooterSubmitButton();
    expect(continueButton).toBeVisible();
    await user.click(continueButton);

    const returningPatientSecondaryInsuranceTitle =
      await findReturningPatientInsuranceTitle();
    expect(returningPatientSecondaryInsuranceTitle).toBeVisible();
    expect(returningPatientSecondaryInsuranceTitle).toHaveTextContent(
      'Do you have the same secondary insurance?'
    );
  });

  it("should delete the returning patient's (with two insurances) secondary insurance and navigate to confirm details page when clicked on 'My insurance is not on this list' button", async () => {
    mswServer.use(
      rest.get(buildPatientAccountGetInsurancesApiPath(), (_req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            data: [mockInsurance, mockSecondaryInsurance],
          })
        );
      })
    );

    const { user } = setup();

    const loader = await findInsurancesLoader();
    await waitFor(() => expect(loader).not.toBeInTheDocument());

    const returningPatientPrimaryInsuranceIsSameButton =
      getReturningPatientInsuranceIsSameButton();
    await user.click(returningPatientPrimaryInsuranceIsSameButton);

    const returningPatientSecondaryInsuranceHasChangedButton =
      getReturningPatientInsuranceHasChangedButton();
    await user.click(returningPatientSecondaryInsuranceHasChangedButton);

    const searchNetworkForm = await findSearchNetworkForm();
    expect(searchNetworkForm).toBeVisible();

    const selectedInsurancePayerInput =
      getSelectedProviderSearchNetworkFormInput();
    expect(selectedInsurancePayerInput).toHaveValue(
      mockSecondaryInsurance.insuranceNetwork.insurancePayerName
    );
    await user.click(selectedInsurancePayerInput);

    const notOnThisListButton = getInsuranceNotInTheListButton();
    await user.click(notOnThisListButton);

    await waitFor(() => {
      expect(mockNavigate).toBeCalledWith(
        ONLINE_SELF_SCHEDULING_ROUTES.CONFIRM_DETAILS
      );
    });
  });

  it("should delete the returning patient's (with two insurances) secondary insurance and navigate to confirm details page when selected 'I don't have insurance' and clicked on 'Continue' button", async () => {
    mswServer.use(
      rest.get(buildPatientAccountGetInsurancesApiPath(), (_req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            data: [mockInsurance, mockSecondaryInsurance],
          })
        );
      })
    );

    const { user } = setup();

    const loader = await findInsurancesLoader();
    await waitFor(() => expect(loader).not.toBeInTheDocument());

    const returningPatientPrimaryInsuranceIsSameButton =
      getReturningPatientInsuranceIsSameButton();
    await user.click(returningPatientPrimaryInsuranceIsSameButton);

    const returningPatientSecondaryInsuranceHasChangedButton =
      getReturningPatientInsuranceHasChangedButton();
    await user.click(returningPatientSecondaryInsuranceHasChangedButton);

    const searchNetworkForm = await findSearchNetworkForm();
    expect(searchNetworkForm).toBeVisible();

    const removeSelectedProviderButton = getRemoveSelectedProviderButton();
    await user.click(removeSelectedProviderButton);

    const doNotHaveInsuranceOption = getInsuranceTypeRadioOption(
      InsuranceType.None
    );
    await user.click(doNotHaveInsuranceOption);

    const continueButton = getFormFooterSubmitButton();
    expect(continueButton).toBeVisible();
    await user.click(continueButton);

    await waitFor(() => {
      expect(mockNavigate).toBeCalledWith(
        ONLINE_SELF_SCHEDULING_ROUTES.CONFIRM_DETAILS
      );
    });
  });

  it("user should be able to change prepopulated secondary insurance data and update secondary insurance via clicking on 'Verify Insurance' button", async () => {
    mswServer.use(
      rest.get(buildPatientAccountGetInsurancesApiPath(), (_req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            data: [mockInsuranceWithEligibleStatus, mockSecondaryInsurance],
          })
        );
      })
    );

    const { user } = setup();

    const loader = await findInsurancesLoader();
    await waitFor(() => expect(loader).not.toBeInTheDocument());

    const returningPatientPrimaryInsuranceIsSameButton =
      getReturningPatientInsuranceIsSameButton();
    await user.click(returningPatientPrimaryInsuranceIsSameButton);

    const returningPatientSecondaryInsuranceHasChangedButton =
      getReturningPatientInsuranceHasChangedButton();
    await user.click(returningPatientSecondaryInsuranceHasChangedButton);

    const searchNetworkForm = await findSearchNetworkForm();
    expect(searchNetworkForm).toBeVisible();

    const selectedSecondaryInsurancePayerInput =
      getSelectedProviderSearchNetworkFormInput();
    expect(selectedSecondaryInsurancePayerInput).toHaveValue(
      mockedInsuranceNetworksList[0].insurancePayerName
    );

    const selectNetworkInput = getNetworkSelectInput();
    expect(selectNetworkInput).toHaveValue(
      mockSecondaryInsurance.insuranceNetwork.id.toString()
    );

    const selectNetworkButton = getNetworkSelectButton();
    await user.click(selectNetworkButton);

    const secondaryInsuranceNetworkOption = await findNetworkSelectOption(
      mockedInsuranceNetwork.id.toString()
    );
    expect(secondaryInsuranceNetworkOption).toHaveTextContent(
      mockedInsuranceNetwork.name
    );
    await user.click(secondaryInsuranceNetworkOption);

    expect(selectNetworkInput).toHaveValue(
      mockedInsuranceNetwork.id.toString()
    );

    const secondaryInsuranceMemberIdInput = getInsuranceMemberIdInput();
    expect(secondaryInsuranceMemberIdInput).toHaveValue(
      mockSecondaryInsurance.memberId.toString()
    );
    await user.clear(secondaryInsuranceMemberIdInput);
    await user.type(
      secondaryInsuranceMemberIdInput,
      mockedInsuranceMemberIdValue
    );
    expect(secondaryInsuranceMemberIdInput).toHaveValue(
      mockedInsuranceMemberIdValue
    );

    const verifyInsuranceButton = getVerifyInsuranceButton();
    expect(verifyInsuranceButton).toBeEnabled();
    await user.click(verifyInsuranceButton);

    const insuranceEligibilityAlert = getInsuranceEligibilityAlert();
    await waitFor(() => expect(insuranceEligibilityAlert).toBeVisible());
    expect(insuranceEligibilityAlert).toHaveTextContent('In Network');

    const addAnotherInsuranceButton = screen.queryByTestId(
      SEARCH_NETWORK_FORM_TEST_IDS.ADD_ANOTHER_INSURANCE_BUTTON
    );
    expect(addAnotherInsuranceButton).not.toBeInTheDocument();

    const continueToConfirmDetailsButton = getFormFooterSubmitButton();
    expect(continueToConfirmDetailsButton).toBeVisible();
    expect(continueToConfirmDetailsButton).toBeEnabled();
  });

  it('should track segment event when insurance is OON', async () => {
    mswServer.use(
      rest.post(
        buildPatientAccountCheckEligibilityApiPath(),
        (_req, res, ctx) => {
          return res.once(
            ctx.status(200),
            ctx.json({
              data: {
                ...mockInsurance,
                eligible: InsuranceEligibilityStatus.Ineligible,
              },
            })
          );
        }
      )
    );

    const { user } = setup();
    const { result: segmentHook } = renderHook(() => useSegment());

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_INSURANCE);

    await addInsuranceFlow(user, {
      eligibilityMessage: 'Out of Network',
    });

    const insuranceEligibilityAlert = getInsuranceEligibilityAlert();
    await waitFor(() => expect(insuranceEligibilityAlert).toBeVisible());

    await waitFor(() => {
      expect(segmentHook.current.pageView).toBeCalledWith(
        SEGMENT_EVENTS.INSURANCE_OON_MESSAGE_VISIBLE
      );
    });
  });
});
