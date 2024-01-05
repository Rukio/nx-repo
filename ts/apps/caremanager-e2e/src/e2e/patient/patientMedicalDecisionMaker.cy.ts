import {
  interceptGETPatientData,
  interceptGETEpisodes,
} from '@*company-data-covered*/caremanager/utils-e2e';
import { el } from '@*company-data-covered*/cypress-shared';
import { faker } from '@faker-js/faker';
import { navigateTo } from '../helpers/navigationHelper';
import {
  CLEAR_BUTTON,
  FULL_PATIENT_DETAILS_BUTTON,
  getPatientDetailsLink,
} from '../helpers/caremanagerHelper';
const OPEN_MORE_OPTIONS_BUTTON =
  'patient-medical-decision-maker-card-options-open';
const EDIT_BUTTON =
  'patient-medical-decision-maker-card-options-edit-menu-item';
const FIRST_NAME_INPUT = 'firstname-input';
const LAST_NAME_INPUT = 'lastname-input';
const ADDRESS_INPUT = 'address-input';
const PHONE_NUMBER_INPUT = 'phonenumber-input';
const RELATIONSHIP_INPUT = 'relationship-input';
const SAVE_BUTTON = 'edit-mdm-save-button';
const PATIENT_DECISION_MAKER_FIRST_NAME = 'patient-decision-maker-first-name';
const PATIENT_DECISION_MAKER_LAST_NAME = 'patient-decision-maker-last-name';
const PATIENT_DECISION_MAKER_ADDRESS = 'patient-decision-maker-address';
const PATIENT_DECISION_MAKER_PHONE_NUMBER =
  'patient-decision-maker-phone-number';
const PATIENT_DECISION_MAKER_RELATIONSHIP =
  'patient-decision-maker-relationship';
const NEW_FIRST_NAME = faker.name.firstName();
const NEW_LAST_NAME = faker.name.lastName();
const NEW_STREET_ADDRESS = faker.address.streetAddress();
const NEW_PHONE_NUMBER = faker.phone.number('1562#######');

describe('Patient Medical Decision Maker', () => {
  before(() => {
    cy.login();
    navigateTo({ location: 'EPISODES_HOMEPAGE' });
  });
  beforeEach(() => {
    interceptGETPatientData({ mockResp: false });
    interceptGETEpisodes({ mockResp: false });
  });

  it('should verify existing patient medical decision maker', () => {
    el(CLEAR_BUTTON).click({ force: true });
    cy.wait('@interceptGETEpisodes')
      .its('response.body')
      .then((response) => {
        el(getPatientDetailsLink(response.episodes[0].patient_id))
          .first()
          .click();
      });
    el(FULL_PATIENT_DETAILS_BUTTON).click();
    cy.wait('@interceptGETPatientData').then((request) => {
      const { first_name, last_name, phone_number, address, relationship } =
        request.response.body.medical_decision_makers[0];

      el(PATIENT_DECISION_MAKER_FIRST_NAME).hasText(first_name);
      el(PATIENT_DECISION_MAKER_LAST_NAME).hasText(last_name);
      el(PATIENT_DECISION_MAKER_ADDRESS).hasText(address);
      el(PATIENT_DECISION_MAKER_PHONE_NUMBER).hasText(phone_number);
      el(PATIENT_DECISION_MAKER_RELATIONSHIP).hasText(relationship);
    });
  });

  it('should edit patient medical decision maker', () => {
    el(OPEN_MORE_OPTIONS_BUTTON).click();
    el(EDIT_BUTTON).click();
    el(FIRST_NAME_INPUT).clear().type(NEW_FIRST_NAME);
    el(LAST_NAME_INPUT).clear().type(NEW_LAST_NAME);
    el(ADDRESS_INPUT).clear().type(NEW_STREET_ADDRESS);
    el(PHONE_NUMBER_INPUT).clear().type(NEW_PHONE_NUMBER);
    el(RELATIONSHIP_INPUT).clear().type('Father');
    el(SAVE_BUTTON).click();
  });

  it('should verify patient medical decision maker', () => {
    el(PATIENT_DECISION_MAKER_FIRST_NAME).hasText(NEW_FIRST_NAME);
    el(PATIENT_DECISION_MAKER_LAST_NAME).hasText(NEW_LAST_NAME);
    el(PATIENT_DECISION_MAKER_ADDRESS).hasText(NEW_STREET_ADDRESS);
    el(PATIENT_DECISION_MAKER_PHONE_NUMBER).hasText(NEW_PHONE_NUMBER);
    el(PATIENT_DECISION_MAKER_RELATIONSHIP).hasText('Father');
  });
});
