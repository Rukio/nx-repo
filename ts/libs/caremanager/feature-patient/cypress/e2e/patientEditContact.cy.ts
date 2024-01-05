import {
  interceptGETPatientDetails,
  interceptGETProviderTypes,
  interceptPATCHPatientDetails,
  navigateCareManagerTo,
} from '@*company-data-covered*/caremanager/utils-e2e';
import { el } from '@*company-data-covered*/cypress-shared';

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

describe('caremanager-feature-patient', () => {
  before(() => {
    cy.login();
  });

  beforeEach(() => {
    interceptGETProviderTypes();
    interceptGETPatientDetails();
    interceptPATCHPatientDetails({ fixtureSuffix: 'Contact' });
    navigateCareManagerTo({ location: 'PATIENT_PAGE' });
  });

  it('should be able to edit patient contact details', () => {
    el(OPEN_MORE_OPTIONS_BUTTON).click();
    el(EDIT_BUTTON).click();
    el(STREET_ADDRESS_INPUT).clear().type('555 North Street');
    el(UNIT_INPUT).clear().type('23');
    el(CITY_INPUT).clear().type('Los Angeles');
    el(PATIENT_CONTACT_FORM).find('#mui-component-select-addressState').click();
    el(CALIFORNIA_OPTION).click();
    el(ZIPCODE_INPUT).clear().type('77665');
    el(PHONE_NUMBER_INPUT).clear().type('+13035001518');
    el(NOTES_INPUT).clear().type("Don't forget to bring a towel");
    el(SAVE_BUTTON).click();
    el(PATIENT_CONTACT_ADDRESS).hasText(
      '555 North Street Los Angeles, California 77665'
    );
    el(PATIENT_CONTACT_PHONE_NUMBER).hasText('+13035001518');
    el(PATIENT_CONTACT_ADDRESS_NOTES).hasText("Don't forget to bring a towel");
  });
});
