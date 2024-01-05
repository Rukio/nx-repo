import { generatePath } from 'react-router-dom';
import { render, screen, waitFor, within } from '../../../testUtils';
import {
  PATIENT_MENU_LIST_ITEM_SECTIONS_IDS,
  TEST_IDS,
} from '@*company-data-covered*/patient-portal/ui';
import PatientDetails, { PATIENT_DATA_MOCK } from './PatientDetails';
import { PATIENT_PORTAL_ROUTES } from '../../constants';
import { PATIENT_DETAILS_TEST_IDS } from './testIds';

const setup = () => render(<PatientDetails />, { withRouter: true });

const consoleSpy = vi.spyOn(console, 'info');

const mockedNavigator = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  );

  return {
    ...actual,
    useNavigate: () => mockedNavigator,
  };
});

const {
  NAME,
  EMAIL,
  PHONE_NUMBER,
  DOB,
  LEGAL_SEX,
  ASSIGNED_SEX_AT_BIRTH,
  GENDER_IDENTITY,
  REMOVE_PATIENT_BUTTON,
} = TEST_IDS.PATIENT_DETAILS;

const getListItem = (testIdPrefix: string) =>
  screen.getByTestId(TEST_IDS.FORMATTED_LIST.getListItemTestId(testIdPrefix));

const getListItemTitle = (item: HTMLElement, testIdPrefix: string) =>
  within(item).getByTestId(
    TEST_IDS.FORMATTED_LIST.getListItemTitleTestId(testIdPrefix)
  );

const getListItemValue = (item: HTMLElement, testIdPrefix: string) =>
  within(item).getByTestId(
    TEST_IDS.FORMATTED_LIST.getListItemChildrenContainerTestId(testIdPrefix)
  );

const getListItemEditButton = (item: HTMLElement, testIdPrefix: string) =>
  within(item).getByTestId(
    TEST_IDS.FORMATTED_LIST.getListItemButtonTestId(testIdPrefix)
  );

const getListItemInfoButton = (item: HTMLElement, testIdPrefix: string) =>
  within(item).getByTestId(
    TEST_IDS.FORMATTED_LIST.getListItemIconButtonTestId(testIdPrefix)
  );

const getRemoveThisPatientButton = () =>
  screen.getByTestId(
    TEST_IDS.SETTINGS_LIST.getButtonListItemButtonTestId(REMOVE_PATIENT_BUTTON)
  );

const findDeletePatientConfirmationModal = () =>
  screen.findByTestId(
    TEST_IDS.MODAL.getModalTestId(
      PATIENT_DETAILS_TEST_IDS.DELETE_CONFIRMATION_MODAL
    )
  );

const getDeletePatientConfirmationModalSubmitButton = (modal: HTMLElement) =>
  within(modal).getByTestId(
    TEST_IDS.CONFIRMATION.getConfirmationButtonTestId(
      PATIENT_DETAILS_TEST_IDS.DELETE_CONFIRMATION
    )
  );

const getDeletePatientConfirmationModalCloseButton = (modal: HTMLElement) =>
  within(modal).getByTestId(
    TEST_IDS.RESPONSIVE_MODAL.getResponsiveCloseButtonTestId(
      PATIENT_DETAILS_TEST_IDS.DELETE_CONFIRMATION_MODAL
    )
  );

describe('<PatientDetails />', () => {
  it('should render correctly', () => {
    setup();

    const pageBackButton = screen.getByTestId(
      TEST_IDS.PAGE_SECTION.getPageSectionBackButtonTestId(
        PATIENT_DETAILS_TEST_IDS.TITLE
      )
    );
    expect(pageBackButton).toBeVisible();
    expect(pageBackButton).toBeEnabled();
    expect(pageBackButton).toHaveTextContent('Settings');

    const formTitle = screen.getByTestId(
      TEST_IDS.PAGE_SECTION.getPageSectionTitleTestId(
        PATIENT_DETAILS_TEST_IDS.TITLE
      )
    );
    expect(formTitle).toBeVisible();
    expect(formTitle).toHaveTextContent('Patient Details');

    const nameItem = getListItem(NAME);
    expect(nameItem).toBeVisible();

    const nameItemTitle = getListItemTitle(nameItem, NAME);
    expect(nameItemTitle).toBeVisible();

    const nameItemValue = getListItemValue(nameItem, NAME);
    expect(nameItemValue).toBeVisible();
    expect(nameItemValue).toHaveTextContent(
      `${PATIENT_DATA_MOCK.firstName} ${PATIENT_DATA_MOCK.lastName}`
    );

    const nameItemInfoButton = getListItemInfoButton(nameItem, NAME);
    expect(nameItemInfoButton).toBeVisible();
    expect(nameItemInfoButton).toBeEnabled();

    const emailItem = getListItem(EMAIL);
    expect(emailItem).toBeVisible();

    const emailItemTitle = getListItemTitle(emailItem, EMAIL);
    expect(emailItemTitle).toBeVisible();

    const emailItemValue = getListItemValue(emailItem, EMAIL);
    expect(emailItemValue).toBeVisible();
    expect(emailItemValue).toHaveTextContent(PATIENT_DATA_MOCK.email);

    const emailItemEditButton = getListItemEditButton(emailItem, EMAIL);
    expect(emailItemEditButton).toBeVisible();
    expect(emailItemEditButton).toBeEnabled();

    const phoneNumberItem = getListItem(PHONE_NUMBER);
    expect(phoneNumberItem).toBeVisible();

    const phoneNumberTitle = getListItemTitle(phoneNumberItem, PHONE_NUMBER);
    expect(phoneNumberTitle).toBeVisible();

    const phoneNumberValue = getListItemValue(phoneNumberItem, PHONE_NUMBER);
    expect(phoneNumberValue).toBeVisible();
    expect(phoneNumberValue).toHaveTextContent(PATIENT_DATA_MOCK.phoneNumber);

    const phoneNumberItemEditButton = getListItemEditButton(
      phoneNumberItem,
      PHONE_NUMBER
    );
    expect(phoneNumberItemEditButton).toBeVisible();
    expect(phoneNumberItemEditButton).toBeEnabled();

    const dobItem = getListItem(DOB);
    expect(dobItem).toBeVisible();

    const dobItemTitle = getListItemTitle(dobItem, DOB);
    expect(dobItemTitle).toBeVisible();

    const dobItemValue = getListItemValue(dobItem, DOB);
    expect(dobItemValue).toBeVisible();
    expect(dobItemValue).toHaveTextContent(PATIENT_DATA_MOCK.dateOfBirth);

    const dobItemInfoButton = getListItemInfoButton(dobItem, DOB);
    expect(dobItemInfoButton).toBeVisible();
    expect(dobItemInfoButton).toBeEnabled();

    const legalSexItem = getListItem(LEGAL_SEX);
    expect(legalSexItem).toBeVisible();

    const legalSexItemTitle = getListItemTitle(legalSexItem, LEGAL_SEX);
    expect(legalSexItemTitle).toBeVisible();

    const legalSexItemValue = getListItemValue(legalSexItem, LEGAL_SEX);
    expect(legalSexItemValue).toBeVisible();
    expect(legalSexItemValue).toHaveTextContent(PATIENT_DATA_MOCK.legalSex);

    const legalSexItemEditButton = getListItemEditButton(
      legalSexItem,
      LEGAL_SEX
    );
    expect(legalSexItemEditButton).toBeVisible();
    expect(legalSexItemEditButton).toBeEnabled();

    const assignedSexAtBirthItem = getListItem(ASSIGNED_SEX_AT_BIRTH);
    expect(assignedSexAtBirthItem).toBeVisible();

    const assignedSexAtBirthItemTitle = getListItemTitle(
      assignedSexAtBirthItem,
      ASSIGNED_SEX_AT_BIRTH
    );
    expect(assignedSexAtBirthItemTitle).toBeVisible();

    const assignedSexAtBirthItemValue = getListItemValue(
      assignedSexAtBirthItem,
      ASSIGNED_SEX_AT_BIRTH
    );
    expect(assignedSexAtBirthItemValue).toBeVisible();
    expect(assignedSexAtBirthItemValue).toHaveTextContent(
      PATIENT_DATA_MOCK.assignedSexAtBirth
    );

    const assignedSexAtBirthItemEditButton = getListItemEditButton(
      assignedSexAtBirthItem,
      ASSIGNED_SEX_AT_BIRTH
    );
    expect(assignedSexAtBirthItemEditButton).toBeVisible();
    expect(assignedSexAtBirthItemEditButton).toBeEnabled();

    const genderIdentityItem = getListItem(GENDER_IDENTITY);
    expect(genderIdentityItem).toBeVisible();

    const genderIdentityItemTitle = getListItemTitle(
      genderIdentityItem,
      GENDER_IDENTITY
    );
    expect(genderIdentityItemTitle).toBeVisible();

    const genderIdentityItemValue = getListItemValue(
      genderIdentityItem,
      GENDER_IDENTITY
    );
    expect(genderIdentityItemValue).toBeVisible();
    expect(genderIdentityItemValue).toHaveTextContent(
      PATIENT_DATA_MOCK.assignedSexAtBirth
    );

    const genderIdentityItemEditButton = getListItemEditButton(
      genderIdentityItem,
      GENDER_IDENTITY
    );
    expect(genderIdentityItemEditButton).toBeVisible();
    expect(genderIdentityItemEditButton).toBeEnabled();

    const removeThisPatientButton = getRemoveThisPatientButton();
    expect(removeThisPatientButton).toBeVisible();
    expect(removeThisPatientButton).toBeEnabled();
    expect(removeThisPatientButton).toHaveTextContent('Remove this Patient');
  });

  it("should display delete confirmation modal when clicking on 'Remove this Patient' button", async () => {
    const { user } = setup();

    const removeThisPatientButton = getRemoveThisPatientButton();
    await user.click(removeThisPatientButton);

    const deleteConfirmationModal = await findDeletePatientConfirmationModal();
    expect(deleteConfirmationModal).toBeVisible();

    const deleteConfirmationModalTitle = within(
      deleteConfirmationModal
    ).getByTestId(
      TEST_IDS.RESPONSIVE_MODAL.getResponsiveModalTitleTestId(
        PATIENT_DETAILS_TEST_IDS.DELETE_CONFIRMATION_MODAL
      )
    );
    expect(deleteConfirmationModalTitle).toBeVisible();
    expect(deleteConfirmationModalTitle).toHaveTextContent(
      'Remove this Patient?'
    );

    const deleteConfirmationModalAlert = within(
      deleteConfirmationModal
    ).getByTestId(
      TEST_IDS.CONFIRMATION.getConfirmationAlertTestId(
        PATIENT_DETAILS_TEST_IDS.DELETE_CONFIRMATION
      )
    );
    expect(deleteConfirmationModalAlert).toBeVisible();
    expect(deleteConfirmationModalAlert).toHaveTextContent(
      'Are you sure you want to remove this patient from your account?'
    );

    const deleteConfirmationModalSubmitButton =
      getDeletePatientConfirmationModalSubmitButton(deleteConfirmationModal);
    expect(deleteConfirmationModalSubmitButton).toBeVisible();
    expect(deleteConfirmationModalSubmitButton).toBeEnabled();
    expect(deleteConfirmationModalSubmitButton).toHaveTextContent(
      'Yes, Remove this Patient'
    );

    const deleteConfirmationModalCloseButton =
      getDeletePatientConfirmationModalCloseButton(deleteConfirmationModal);
    expect(deleteConfirmationModalCloseButton).toBeVisible();
    expect(deleteConfirmationModalCloseButton).toBeEnabled();
  });

  it("should close delete confirmation modal when clicking on 'Close' button", async () => {
    const { user } = setup();

    const removeThisPatientButton = getRemoveThisPatientButton();
    await user.click(removeThisPatientButton);

    const deleteConfirmationModal = await findDeletePatientConfirmationModal();
    expect(deleteConfirmationModal).toBeVisible();

    const deleteConfirmationModalCloseButton =
      getDeletePatientConfirmationModalCloseButton(deleteConfirmationModal);
    await user.click(deleteConfirmationModalCloseButton);

    await waitFor(() =>
      expect(deleteConfirmationModal).not.toBeInTheDocument()
    );
  });

  it("should redirect to landing page when clicking on 'Yes, Remove this Patient' button", async () => {
    const { user } = setup();

    const removeThisPatientButton = getRemoveThisPatientButton();
    await user.click(removeThisPatientButton);

    const deleteConfirmationModal = await findDeletePatientConfirmationModal();
    expect(deleteConfirmationModal).toBeVisible();

    const deleteConfirmationModalSubmitButton =
      getDeletePatientConfirmationModalSubmitButton(deleteConfirmationModal);
    await user.click(deleteConfirmationModalSubmitButton);

    expect(mockedNavigator).toBeCalledWith(
      generatePath(PATIENT_PORTAL_ROUTES.LANDING_PAGE)
    );
  });

  it("should call onInfo when clicking any section's info button", async () => {
    const { user } = setup();

    const nameItem = getListItem(NAME);
    const nameItemInfoButton = getListItemInfoButton(nameItem, NAME);
    await user.click(nameItemInfoButton);

    //TODO(PT-1619): this is temporary, will be removed after data-access is implemented
    expect(consoleSpy).toBeCalledWith(
      `${PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.NAME}-info`
    );
  });

  it("should call onEdit when clicking any section's edit button", async () => {
    const { user } = setup();

    const emailItem = getListItem(EMAIL);
    const emailItemEditButton = getListItemEditButton(emailItem, EMAIL);
    await user.click(emailItemEditButton);

    //TODO(PT-1619): this is temporary, will be removed after data-access is implemented
    expect(consoleSpy).toBeCalledWith(
      `${PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.EMAIL}-edit`
    );
  });
});
