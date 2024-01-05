import {
  interceptGETPatientDetails,
  interceptGETProviderTypes,
  interceptPATCHPatientDetails,
  navigateCareManagerTo,
} from '@*company-data-covered*/caremanager/utils-e2e';
import { el } from '@*company-data-covered*/cypress-shared';

const OPEN_MORE_OPTIONS_BUTTON = 'patient-demographics-card-options-open';
const EDIT_BUTTON = 'patient-demographics-card-options-edit-menu-item';
const PATIENT_DEMOGRAPHICS_FORM = 'edit-patient-demographics-form';
const FIRST_NAME_INPUT = 'firstname-input';
const MIDDLE_NAME_INPUT = 'middlename-input';
const LAST_NAME_INPUT = 'lastname-input';
const DOB_INPUT = 'date-of-birth-date';
const SEX_MALE_OPTION = 'sex-male-option';
const ATHENA_ID_INPUT = 'athenamedicalrecordnumber-input';
const SAVE_BUTTON = 'edit-patient-demographics-save-button';
const PATIENT_FULL_NAME = 'patient-page-full-name';
const PATIENT_FIRST_NAME = 'patient-demographics-first-name';
const PATIENT_MIDDLE_NAME = 'patient-demographics-middle-name';
const PATIENT_LAST_NAME = 'patient-demographics-last-name';
const PATIENT_DOB = 'patient-demographics-dob';
const PATIENT_SEX = 'patient-demographics-sex';
const PATIENT_ATHENA_ID = 'patient-demographics-athena-id';

describe('caremanager-feature-patient', () => {
  before(() => {
    cy.login();
  });

  beforeEach(() => {
    interceptGETProviderTypes();
    interceptGETPatientDetails();
    interceptPATCHPatientDetails({ fixtureSuffix: 'Demographics' });
    navigateCareManagerTo({ location: 'PATIENT_PAGE' });
  });

  it('should be able to edit patient demographics details', () => {
    el(OPEN_MORE_OPTIONS_BUTTON).click();
    el(EDIT_BUTTON).click();
    el(FIRST_NAME_INPUT).clear().type('Joe');
    el(MIDDLE_NAME_INPUT).clear().type('C');
    el(LAST_NAME_INPUT).clear().type('Montana');
    el(DOB_INPUT).clear().type('06111956');
    el(PATIENT_DEMOGRAPHICS_FORM).find('#mui-component-select-sex').click();
    el(SEX_MALE_OPTION).click();
    el(ATHENA_ID_INPUT).clear().type('16');
    el(SAVE_BUTTON).click();
    el(PATIENT_FULL_NAME).hasText('Joe C Montana');
    el(PATIENT_FIRST_NAME).hasText('Joe');
    el(PATIENT_MIDDLE_NAME).hasText('C');
    el(PATIENT_LAST_NAME).hasText('Montana');
    el(PATIENT_DOB).hasText('06/11/1956');
    el(PATIENT_SEX).hasText('male');
    el(PATIENT_ATHENA_ID).hasText('16');
  });
});
