import {
  interceptGETPatientData,
  interceptPOSTInsurance,
  interceptGETEpisodes,
} from '@*company-data-covered*/caremanager/utils-e2e';
import { el } from '@*company-data-covered*/cypress-shared';
import { faker } from '@faker-js/faker';
import {
  CLEAR_BUTTON,
  FULL_PATIENT_DETAILS_BUTTON,
  getPatientDetailsLink,
  setupE2ECareRequest,
} from '../helpers/caremanagerHelper';
import { navigateTo } from '../helpers/navigationHelper';

/* Selectors */

const PHARMACY_NAME = faker.company.name();
const PHARMACY_PHONE_NUMBER = faker.phone.number('1562#######');
const PHARMACY_FAX_NUMBER = faker.phone.number('1562#######');
const PHARMACY_ADDRESS = faker.address.streetAddress();
const PHARMACY_OPTIONS_BUTTON = 'patient-pharmacy-card-options-open';
const PHARMACY_EDIT_BUTTON = 'patient-pharmacy-card-options-edit-menu-item';
const PHARMACY_NAME_INPUT = 'name-input';
const PHARMACY_PHONE_INPUT = 'phonenumber-input';
const PHARMACY_FAX_INPUT = 'faxnumber-input';
const PHARMACY_ADDRESS_INPUT = 'address-input';
const PHARMACY_SAVE_BUTTON = 'edit-pharmacy-save-button';
const PATIENT_PHARMACY_NAME = 'patient-pharmacy-name';
const PATIENT_PHARMACY_PHONE_NUMBER = 'patient-pharmacy-phone-number';
const PATIENT_PHARMACY_FAX_NUMBER = 'patient-pharmacy-fax-number';
const PATIENT_PHARMACY_ADDRESS = 'patient-pharmacy-address';
const EPISODES_SEARCH_INPUT = 'search-input';
const ADD_PHARMACY_BUTTON = 'add-pharmacy-button';

function verifyPharmacyEdits() {
  el(PATIENT_PHARMACY_NAME).hasText(PHARMACY_NAME);
  el(PATIENT_PHARMACY_PHONE_NUMBER).hasText(PHARMACY_PHONE_NUMBER);
  el(PATIENT_PHARMACY_FAX_NUMBER).hasText(PHARMACY_FAX_NUMBER);
  el(PATIENT_PHARMACY_ADDRESS)
    .hasText(PHARMACY_ADDRESS)
    .wrap('href')
    .should('not.be.empty');
}

describe('Patient Pharmacy', () => {
  before(() => {
    cy.login();
    setupE2ECareRequest();
  });
  beforeEach(() => {
    navigateTo({ location: 'EPISODES_HOMEPAGE' });
    interceptGETPatientData({ mockResp: false });
    interceptPOSTInsurance({ mockResp: false });
    const firstName = Cypress.env('currentPatientFirstName');
    el(CLEAR_BUTTON).click({ force: true });
    el(EPISODES_SEARCH_INPUT).clear().type(firstName);
    interceptGETEpisodes({ mockResp: false });
    cy.wait('@interceptGETEpisodes')
      .its('response.body')
      .then((response) => {
        el(getPatientDetailsLink(response.episodes[0].patient_id))
          .first()
          .click();
      });
    el(FULL_PATIENT_DETAILS_BUTTON).click();
  });

  it('should create new pharmacy details', () => {
    el(ADD_PHARMACY_BUTTON).click();
    el(PHARMACY_NAME_INPUT).clear().type(PHARMACY_NAME);
    el(PHARMACY_PHONE_INPUT).clear().type(PHARMACY_PHONE_NUMBER);
    el(PHARMACY_FAX_INPUT).clear().type(PHARMACY_FAX_NUMBER);
    el(PHARMACY_ADDRESS_INPUT).clear().type(PHARMACY_ADDRESS);
    el(PHARMACY_SAVE_BUTTON).click({ force: true });
    verifyPharmacyEdits();
  });

  it('should edit patient pharmacy details', () => {
    el(PHARMACY_OPTIONS_BUTTON).click();
    el(PHARMACY_EDIT_BUTTON).click();
    el(PHARMACY_NAME_INPUT).clear().type(PHARMACY_NAME);
    el(PHARMACY_PHONE_INPUT).clear().type(PHARMACY_PHONE_NUMBER);
    el(PHARMACY_FAX_INPUT).clear().type(PHARMACY_FAX_NUMBER);
    el(PHARMACY_ADDRESS_INPUT).clear().type(PHARMACY_ADDRESS);
    el(PHARMACY_SAVE_BUTTON).click({ force: true });
    verifyPharmacyEdits();
  });
});
