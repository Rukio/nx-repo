import { formattedDOB } from '@*company-data-covered*/caremanager/utils';
import {
  interceptGETEpisodes,
  interceptGETPatientData,
} from '@*company-data-covered*/caremanager/utils-e2e';
import { el } from '@*company-data-covered*/cypress-shared';
import { faker } from '@faker-js/faker';
import { navigateTo } from '../helpers/navigationHelper';

/* Selectors */
const OPEN_MORE_OPTIONS_BUTTON = 'patient-demographics-card-options-open';
const EDIT_BUTTON = 'patient-demographics-card-options-edit-menu-item';
const CLEAR_BUTTON = 'clear-button';
const FULL_PATIENT_DETAILS_BUTTON = 'full-patient-details-button';
const getPatientDetailsLink = (cmId: string) => `patient-details-link-${cmId}`;
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
const PATIENT_DEMOGRAPHICS_FORM = 'edit-patient-demographics-form';
const NEW_FIRST_NAME = faker.name.firstName();
const NEW_MIDDLE_NAME = faker.name.middleName();
const NEW_LAST_NAME = faker.name.lastName();
const NEW_DOB = '10/10/2000';
const NEW_ATHENA_ID = faker.random.numeric();

describe('Patient Demographics', () => {
  before(() => {
    cy.login();
    navigateTo({ location: 'EPISODES_HOMEPAGE' });
  });

  it('should verify existing patient demographics details', () => {
    el(CLEAR_BUTTON).click({ force: true });

    interceptGETEpisodes({ mockResp: false });
    cy.wait('@interceptGETEpisodes')
      .its('response.body')
      .then((id) => {
        el(getPatientDetailsLink(id.episodes[0].patient_id)).first().click();
      });
    interceptGETPatientData({ mockResp: false });

    el(FULL_PATIENT_DETAILS_BUTTON).click();

    cy.wait('@interceptGETPatientData').then((request) => {
      const {
        first_name,
        last_name,
        middle_name,
        date_of_birth,
        sex,
        athena_id,
      } = request.response.body.patient;
      el(PATIENT_FIRST_NAME).hasText(first_name);
      el(PATIENT_MIDDLE_NAME).hasText(middle_name);
      el(PATIENT_LAST_NAME).hasText(last_name);
      el(PATIENT_DOB).hasText(formattedDOB(date_of_birth));
      el(PATIENT_SEX).hasText(sex);
      el(PATIENT_ATHENA_ID).hasText(athena_id);
    });
  });

  it('should edit new patient demographics details', () => {
    el(OPEN_MORE_OPTIONS_BUTTON).click();
    el(EDIT_BUTTON).click();
    el(FIRST_NAME_INPUT).clear().type(NEW_FIRST_NAME);
    el(MIDDLE_NAME_INPUT).clear().type(NEW_MIDDLE_NAME);
    el(LAST_NAME_INPUT).clear().type(NEW_LAST_NAME);
    el(DOB_INPUT).clear().type(NEW_DOB);
    el(PATIENT_DEMOGRAPHICS_FORM).find('#mui-component-select-sex').click();
    el(SEX_MALE_OPTION).click();
    el(ATHENA_ID_INPUT).clear().type(NEW_ATHENA_ID);
    el(SAVE_BUTTON).click();
  });

  it('should verify new patient demographics details', () => {
    el(PATIENT_FULL_NAME).hasText(
      `${NEW_FIRST_NAME} ${NEW_MIDDLE_NAME} ${NEW_LAST_NAME}`
    );
    el(PATIENT_FIRST_NAME).hasText(NEW_FIRST_NAME);
    el(PATIENT_MIDDLE_NAME).hasText(NEW_MIDDLE_NAME);
    el(PATIENT_LAST_NAME).hasText(NEW_LAST_NAME);
    el(PATIENT_DOB).hasText(formattedDOB(NEW_DOB));
    el(PATIENT_ATHENA_ID).hasText(NEW_ATHENA_ID);
  });
});
