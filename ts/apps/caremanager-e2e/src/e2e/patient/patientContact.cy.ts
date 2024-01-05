import {
  interceptGETEpisodes,
  interceptGETPatientData,
} from '@*company-data-covered*/caremanager/utils-e2e';
import { el } from '@*company-data-covered*/cypress-shared';
import { faker } from '@faker-js/faker';
import { navigateTo } from '../helpers/navigationHelper';

/* Selectors */
const CLEAR_BUTTON = 'clear-button';
const FULL_PATIENT_DETAILS_BUTTON = 'full-patient-details-button';
const getPatientDetailsLink = (cmId: string) => `patient-details-link-${cmId}`;
const OPEN_MORE_OPTIONS_BUTTON = 'patient-contact-card-options-open';
const EDIT_BUTTON = 'patient-contact-card-options-edit-menu-item';
const SAVE_BUTTON = 'edit-patient-save-button';
const PATIENT_CONTACT_FORM = 'edit-patient-form';
const STREET_ADDRESS_INPUT = 'addressstreet-input';
const UNIT_INPUT = 'addressstreet2-input';
const CITY_INPUT = 'addresscity-input';
const CALIFORNIA_OPTION = 'addressstate-ca-option';
const ZIPCODE_INPUT = 'addresszipcode-input';
const PHONE_NUMBER_INPUT = 'phonenumber-input';
const NOTES_INPUT = 'addressnotes-input';
const PATIENT_CONTACT_ADDRESS = 'patient-contact-address';
const PATIENT_CONTACT_PHONE_NUMBER = 'patient-contact-phone-number';
const PATIENT_CONTACT_ADDRESS_NOTES = 'patient-contact-address-notes';
const NEW_STREET_ADDRESS = faker.address.streetAddress();
const NEW_CITY_ADDRESS = faker.address.city();
const NEW_PHONE_NUMBER = faker.phone.number('1562#######');
const NEW_ZIPCODE_ADDRESS = faker.address.zipCode();

describe('Patient Contacts', () => {
  before(() => {
    cy.login();
    navigateTo({ location: 'EPISODES_HOMEPAGE' });
  });

  it('should verify existing patient contact details', () => {
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
        address_street,
        address_street_2,
        address_city,
        address_state,
        address_zipcode,
        address_notes,
        phone_number,
      } = request.response.body.patient;
      el(PATIENT_CONTACT_ADDRESS).hasText(
        `${address_street} ${address_street_2} ${address_city}, ${address_state} ${address_zipcode}`
      );
      el(PATIENT_CONTACT_PHONE_NUMBER).hasText(phone_number);
      el(PATIENT_CONTACT_ADDRESS_NOTES).hasText(address_notes);
    });
  });

  it('should edit new patient contact details', () => {
    el(OPEN_MORE_OPTIONS_BUTTON).click();
    el(EDIT_BUTTON).click();
    el(STREET_ADDRESS_INPUT).clear().type(NEW_STREET_ADDRESS);
    el(UNIT_INPUT).clear().type('23');
    el(CITY_INPUT).clear().type(NEW_CITY_ADDRESS);
    el(PATIENT_CONTACT_FORM).find('#mui-component-select-addressState').click();
    el(CALIFORNIA_OPTION).click();
    el(ZIPCODE_INPUT).clear().type(NEW_ZIPCODE_ADDRESS);
    el(PHONE_NUMBER_INPUT).clear().type(NEW_PHONE_NUMBER);
    el(NOTES_INPUT).clear().type('Critical E2E PATH');
    el(SAVE_BUTTON).click();
  });

  it('should verify new patient contact details', () => {
    el(PATIENT_CONTACT_ADDRESS).hasText(
      `${NEW_STREET_ADDRESS} ${'23'} ${NEW_CITY_ADDRESS}, ${'CA'} ${NEW_ZIPCODE_ADDRESS}`
    );
    el(PATIENT_CONTACT_PHONE_NUMBER).hasText(NEW_PHONE_NUMBER);
    el(PATIENT_CONTACT_ADDRESS_NOTES).hasText('Critical E2E PATH');
  });
});
