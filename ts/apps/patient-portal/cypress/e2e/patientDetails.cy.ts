import { el } from '@*company-data-covered*/cypress-shared';
import {
  APP_BAR_CONTAINER,
  PATIENT_DETAILS_TEST_IDS,
} from './helpers/selectors';

const PATIENT_DATA_MOCK = {
  firstName: 'Alexandra',
  lastName: 'Anderson',
  email: 'aanderson87@gmail.com',
  dateOfBirth: '09/28/1987',
  phoneNumber: '(508) 555-1234',
  legalSex: 'Male',
  assignedSexAtBirth: 'Female',
  genderIdentity: 'Female',
  billingAddress: {
    id: 'RANDOM_ID',
    streetAddress1: '1000 Elm St',
    streetAddress2: '#203',
    city: 'Denver',
    state: 'CO',
    zipCode: '80205',
  },
};

describe('Patient Details', () => {
  const mockId = 1;

  beforeEach(() => cy.visit(`/patients/${mockId}`));

  it('should render correctly', () => {
    el(APP_BAR_CONTAINER).isVisible();
    el(PATIENT_DETAILS_TEST_IDS.PAGE).isVisible();

    el(PATIENT_DETAILS_TEST_IDS.TITLE).isVisible().contains('Patient Details');

    el(PATIENT_DETAILS_TEST_IDS.NAME_ITEM).isVisible().contains('Name');
    el(PATIENT_DETAILS_TEST_IDS.NAME_VALUE)
      .isVisible()
      .contains(`${PATIENT_DATA_MOCK.firstName} ${PATIENT_DATA_MOCK.lastName}`);
    el(PATIENT_DETAILS_TEST_IDS.NAME_ITEM_BUTTON).isVisible().isEnabled();

    el(PATIENT_DETAILS_TEST_IDS.EMAIL_ITEM).isVisible().contains('Email');
    el(PATIENT_DETAILS_TEST_IDS.EMAIL_VALUE)
      .isVisible()
      .contains(PATIENT_DATA_MOCK.email);
    el(PATIENT_DETAILS_TEST_IDS.EMAIL_ITEM_BUTTON)
      .isVisible()
      .contains('Edit')
      .isEnabled();

    el(PATIENT_DETAILS_TEST_IDS.PHONE_NUMBER_ITEM)
      .isVisible()
      .contains('Phone Number');
    el(PATIENT_DETAILS_TEST_IDS.PHONE_NUMBER_VALUE)
      .isVisible()
      .contains(PATIENT_DATA_MOCK.phoneNumber);
    el(PATIENT_DETAILS_TEST_IDS.PHONE_NUMBER_ITEM_BUTTON)
      .isVisible()
      .contains('Edit')
      .isEnabled();

    el(PATIENT_DETAILS_TEST_IDS.DOB_ITEM).isVisible().contains('Date of Birth');
    el(PATIENT_DETAILS_TEST_IDS.DOB_VALUE)
      .isVisible()
      .contains(PATIENT_DATA_MOCK.dateOfBirth);
    el(PATIENT_DETAILS_TEST_IDS.DOB_ITEM_BUTTON).isVisible().isEnabled();

    el(PATIENT_DETAILS_TEST_IDS.LEGAL_SEX_ITEM)
      .isVisible()
      .contains('Legal Sex');
    el(PATIENT_DETAILS_TEST_IDS.LEGAL_SEX_VALUE)
      .isVisible()
      .contains(PATIENT_DATA_MOCK.legalSex);
    el(PATIENT_DETAILS_TEST_IDS.LEGAL_SEX_ITEM_BUTTON)
      .isVisible()
      .contains('Edit')
      .isEnabled();

    el(PATIENT_DETAILS_TEST_IDS.ASSIGNED_SEX_AT_BIRTH_ITEM)
      .isVisible()
      .contains('Assigned Sex at Birth');
    el(PATIENT_DETAILS_TEST_IDS.ASSIGNED_SEX_AT_BIRTH_VALUE)
      .isVisible()
      .contains(PATIENT_DATA_MOCK.assignedSexAtBirth);
    el(PATIENT_DETAILS_TEST_IDS.ASSIGNED_SEX_AT_BIRTH_ITEM_BUTTON)
      .isVisible()
      .contains('Edit')
      .isEnabled();

    el(PATIENT_DETAILS_TEST_IDS.GENDER_IDENTITY_ITEM)
      .isVisible()
      .contains('Gender Identity');
    el(PATIENT_DETAILS_TEST_IDS.GENDER_IDENTITY_VALUE)
      .isVisible()
      .contains(PATIENT_DATA_MOCK.genderIdentity);
    el(PATIENT_DETAILS_TEST_IDS.GENDER_IDENTITY_ITEM_BUTTON)
      .isVisible()
      .contains('Edit')
      .isEnabled();

    el(PATIENT_DETAILS_TEST_IDS.REMOVE_PATIENT_BUTTON)
      .isVisible()
      .contains('Remove this Patient')
      .isEnabled();
  });

  it('should navigate to landing page when back button is clicked', () => {
    el(PATIENT_DETAILS_TEST_IDS.BACK_BUTTON)
      .isVisible()
      .contains('Settings')
      .click();

    cy.validateLocationPath('/');
  });

  it("should open delete confirmation modal when clicking on 'Remove this Patient' button and redirect to landing page when clicking on 'Yes, Remove this Patient' button", () => {
    el(PATIENT_DETAILS_TEST_IDS.REMOVE_PATIENT_BUTTON)
      .isVisible()
      .contains('Remove this Patient')
      .isEnabled()
      .click();

    el(PATIENT_DETAILS_TEST_IDS.DELETE_CONFIRMATION_MODAL).isVisible();

    el(PATIENT_DETAILS_TEST_IDS.DELETE_CONFIRMATION_MODAL_CLOSE_BUTTON)
      .isVisible()
      .isEnabled();

    el(PATIENT_DETAILS_TEST_IDS.DELETE_CONFIRMATION_MODAL_TITLE)
      .isVisible()
      .contains('Remove this Patient?');

    el(PATIENT_DETAILS_TEST_IDS.DELETE_CONFIRMATION_MODAL_ALERT)
      .isVisible()
      .contains(
        'Are you sure you want to remove this patient from your account?'
      );

    el(PATIENT_DETAILS_TEST_IDS.DELETE_CONFIRMATION_MODAL_SUBMIT_BUTTON)
      .isVisible()
      .contains('Yes, Remove this Patient')
      .isEnabled()
      .click();

    cy.validateLocationPath('/');
  });
});
