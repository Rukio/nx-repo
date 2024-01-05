import { el } from '@*company-data-covered*/cypress-shared';

// TODO: AC-830 change selectors to use the  naming convention
const FIRST_NAME_INPUT = 'firstname-input';
const MIDDLE_NAME_INPUT = 'middlename-input';
const LAST_NAME_INPUT = 'lastname-input';
const BIRTH_DATE_FIELD = 'birth-date';
const ATHENA_NUMBER_INPUT = 'athenamedicalrecordnumber-input';
const ADDRESS_STREET_INPUT = 'addressstreet-input';
const ADDRESS_STREET2_INPUT = 'addressstreet2-input';
const ADDRESS_CITY_INPUT = 'addresscity-input';
const ADDRESS_NOTES_INPUT = 'addressnotes-input';
const PHONE_NUMBER_INPUT = 'phonenumber-input';

export const isSnackbarVisible = (text: string) => {
  cy.get('#notistack-snackbar').hasText(text);
};

export const populatePatientForm = () => {
  el(FIRST_NAME_INPUT).clear().type('Jane');
  el(MIDDLE_NAME_INPUT).clear().type('Mary');
  el(LAST_NAME_INPUT).clear().type('Doe');
  el(BIRTH_DATE_FIELD).find('input').click().clear().type('05/21/1956');
  el(ATHENA_NUMBER_INPUT).clear().type('324532387');
  el(ADDRESS_STREET_INPUT).clear().type('2ND STREET');
  el(ADDRESS_STREET2_INPUT).clear().type('2');
  el(ADDRESS_CITY_INPUT).clear().type('Aspen');
  el(ADDRESS_NOTES_INPUT).clear().type('TEST NOTE');
  el(PHONE_NUMBER_INPUT).clear().type('2323232323');
};

export const patientDetailsCell = (id: number) => `patient-details-cell-${id}`;
