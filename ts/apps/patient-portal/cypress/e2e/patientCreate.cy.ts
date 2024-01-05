import { el } from '@*company-data-covered*/cypress-shared';
import {
  APP_BAR_CONTAINER,
  CREATE_PATIENT_PAGE_TEST_IDS,
} from './helpers/selectors';

const ASSIGNED_SEX_OPTIONS = [
  {
    value: 'Male',
    dataTestId: 'male',
  },
  {
    value: 'Female',
    dataTestId: 'female',
  },
];

const GENDER_IDENTITY_OPTIONS = [
  {
    value: 'Identifies as Male',
    dataTestId: 'male',
  },
  {
    value: 'Identifies as Female',
    dataTestId: 'female',
  },
  {
    value: 'Transgender Male/Female-to-Male (FTM)',
    dataTestId: 'ftm',
  },
  {
    value: 'Transgender Female/Male-to-Female (MTF)',
    dataTestId: 'mtf',
  },
  {
    value: 'Gender non-conforming (neither exclusively male nor female)',
    dataTestId: 'non-conforming',
  },
  {
    value: 'Additional gender category / other, please specify',
    dataTestId: 'other',
  },
  {
    value: 'Choose not to disclose',
    dataTestId: 'not-to-disclose',
  },
];

describe('Add Patient', () => {
  beforeEach(() => cy.visit('/patients/create'));

  it('should render initial state  correctly', () => {
    el(APP_BAR_CONTAINER).isVisible();
    el(CREATE_PATIENT_PAGE_TEST_IDS.PAGE).isVisible();

    el(CREATE_PATIENT_PAGE_TEST_IDS.TITLE)
      .isVisible()
      .contains('Create Patient');

    el(CREATE_PATIENT_PAGE_TEST_IDS.FIRST_NAME)
      .isVisible()
      .hasPlaceholder('First Name');

    el(CREATE_PATIENT_PAGE_TEST_IDS.LAST_NAME)
      .isVisible()
      .hasPlaceholder('Last Name');

    el(CREATE_PATIENT_PAGE_TEST_IDS.PHONE_NUMBER)
      .isVisible()
      .hasPlaceholder('Phone Number');

    el(CREATE_PATIENT_PAGE_TEST_IDS.DATE_OF_BIRTH)
      .isVisible()
      .hasPlaceholder('Date of Birth');

    el(CREATE_PATIENT_PAGE_TEST_IDS.ASSIGNED_SEX)
      .isVisible()
      .contains('Select Assigned Sex at Birth');

    el(CREATE_PATIENT_PAGE_TEST_IDS.ASSIGNED_SEX).click();

    ASSIGNED_SEX_OPTIONS.forEach((option) => {
      el(
        CREATE_PATIENT_PAGE_TEST_IDS.getCreatePatientFormAssignedSexOptionTestId(
          option.dataTestId
        )
      )
        .isVisible()
        .contains(option.value);
    });

    el(
      CREATE_PATIENT_PAGE_TEST_IDS.getCreatePatientFormAssignedSexOptionTestId(
        ASSIGNED_SEX_OPTIONS[0].dataTestId
      )
    ).click();

    el(CREATE_PATIENT_PAGE_TEST_IDS.GENDER_IDENTITY)
      .isVisible()
      .contains('Select Gender Identity');

    el(CREATE_PATIENT_PAGE_TEST_IDS.GENDER_IDENTITY).click();

    GENDER_IDENTITY_OPTIONS.forEach((option) => {
      el(
        CREATE_PATIENT_PAGE_TEST_IDS.getCreatePatientFormGenderIdentityOptionTestId(
          option.dataTestId
        )
      )
        .isVisible()
        .contains(option.value);
    });

    el(
      CREATE_PATIENT_PAGE_TEST_IDS.getCreatePatientFormGenderIdentityOptionTestId(
        GENDER_IDENTITY_OPTIONS[0].dataTestId
      )
    ).click();

    el(CREATE_PATIENT_PAGE_TEST_IDS.SUBMIT_BUTTON)
      .isVisible()
      .contains('Save')
      .isDisabled();
  });

  it('should navigate to landing page when back button is clicked', () => {
    el(CREATE_PATIENT_PAGE_TEST_IDS.BACK_BUTTON)
      .isVisible()
      .contains('Settings');

    el(CREATE_PATIENT_PAGE_TEST_IDS.BACK_BUTTON).click();

    cy.validateLocationPath('/');
  });

  it('should show an error when required fields are touched and empty', () => {
    el(CREATE_PATIENT_PAGE_TEST_IDS.FIRST_NAME).click().blur();

    el(CREATE_PATIENT_PAGE_TEST_IDS.FIRST_NAME_FORM_CONTROL)
      .isVisible()
      .within(() => cy.get('p').contains('First name is required'));

    el(CREATE_PATIENT_PAGE_TEST_IDS.LAST_NAME).click().blur();

    el(CREATE_PATIENT_PAGE_TEST_IDS.LAST_NAME_FORM_CONTROL)
      .isVisible()
      .within(() => cy.get('p').contains('Last name is required'));

    el(CREATE_PATIENT_PAGE_TEST_IDS.PHONE_NUMBER).click().blur();

    el(CREATE_PATIENT_PAGE_TEST_IDS.PHONE_NUMBER_FORM_CONTROL)
      .isVisible()
      .within(() => cy.get('p').contains('Phone number is required'));

    el(CREATE_PATIENT_PAGE_TEST_IDS.DATE_OF_BIRTH).click().blur();

    el(CREATE_PATIENT_PAGE_TEST_IDS.DATE_OF_BIRTH_FORM_CONTROL)
      .isVisible()
      .within(() => cy.get('p').contains('Date of birth is required'));

    el(CREATE_PATIENT_PAGE_TEST_IDS.ASSIGNED_SEX).dblclick();

    // to close the select
    cy.get('body').type('{esc}');

    el(CREATE_PATIENT_PAGE_TEST_IDS.LAST_NAME).click().blur();

    el(CREATE_PATIENT_PAGE_TEST_IDS.ASSIGNED_SEX_FORM_CONTROL)
      .isVisible()
      .within(() =>
        cy
          .get('p')
          .contains(
            'assignedSexAtBirth must be one of the following values: Male, Female'
          )
      );
  });

  it('should redirect to landing page when form submitted', () => {
    el(CREATE_PATIENT_PAGE_TEST_IDS.FIRST_NAME)
      .isVisible()
      .hasPlaceholder('First Name')
      .type('John');

    el(CREATE_PATIENT_PAGE_TEST_IDS.LAST_NAME)
      .isVisible()
      .hasPlaceholder('Last Name')
      .type('Doe');

    el(CREATE_PATIENT_PAGE_TEST_IDS.PHONE_NUMBER)
      .isVisible()
      .hasPlaceholder('Phone Number')
      .type('8003001000');

    el(CREATE_PATIENT_PAGE_TEST_IDS.DATE_OF_BIRTH)
      .isVisible()
      .hasPlaceholder('Date of Birth')
      .type('01/01/1980');

    el(CREATE_PATIENT_PAGE_TEST_IDS.ASSIGNED_SEX)
      .isVisible()
      .contains('Select Assigned Sex at Birth');

    el(CREATE_PATIENT_PAGE_TEST_IDS.ASSIGNED_SEX).click();

    ASSIGNED_SEX_OPTIONS.forEach((option) => {
      el(
        CREATE_PATIENT_PAGE_TEST_IDS.getCreatePatientFormAssignedSexOptionTestId(
          option.dataTestId
        )
      )
        .isVisible()
        .contains(option.value);
    });

    el(
      CREATE_PATIENT_PAGE_TEST_IDS.getCreatePatientFormAssignedSexOptionTestId(
        ASSIGNED_SEX_OPTIONS[0].dataTestId
      )
    ).click();

    el(CREATE_PATIENT_PAGE_TEST_IDS.GENDER_IDENTITY)
      .isVisible()
      .contains('Select Gender Identity');

    el(CREATE_PATIENT_PAGE_TEST_IDS.GENDER_IDENTITY).click();

    GENDER_IDENTITY_OPTIONS.forEach((option) => {
      el(
        CREATE_PATIENT_PAGE_TEST_IDS.getCreatePatientFormGenderIdentityOptionTestId(
          option.dataTestId
        )
      )
        .isVisible()
        .contains(option.value);
    });

    el(
      CREATE_PATIENT_PAGE_TEST_IDS.getCreatePatientFormGenderIdentityOptionTestId(
        GENDER_IDENTITY_OPTIONS[0].dataTestId
      )
    ).click();

    el(CREATE_PATIENT_PAGE_TEST_IDS.SUBMIT_BUTTON)
      .isVisible()
      .contains('Save')
      .click();

    cy.validateLocationPath('/');
  });
});
