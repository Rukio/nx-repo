import {
  interceptGETPatientDetails,
  interceptGETProviderTypes,
  interceptPATCHPharmacy,
  navigateCareManagerTo,
} from '@*company-data-covered*/caremanager/utils-e2e';
import { el } from '@*company-data-covered*/cypress-shared';

const OPEN_MORE_OPTIONS_BUTTON = 'patient-pharmacy-card-options-open';
const EDIT_BUTTON = 'patient-pharmacy-card-options-edit-menu-item';
const NAME_INPUT = 'name-input';
const PHONE_NUMBER_INPUT = 'phonenumber-input';
const FAX_INPUT = 'faxnumber-input';
const ADDRESS_INPUT = 'address-input';
const SAVE_BUTTON = 'edit-pharmacy-save-button';
const PATIENT_PHARMACY_NAME = 'patient-pharmacy-name';
const PATIENT_PHARMACY_PHONE_NUMBER = 'patient-pharmacy-phone-number';
const PATIENT_PHARMACY_FAX_NUMBER = 'patient-pharmacy-fax-number';
const PATIENT_PHARMACY_ADDRESS = 'patient-pharmacy-address';

describe('caremanager-feature-patient', () => {
  before(() => {
    cy.login();
  });

  beforeEach(() => {
    interceptGETProviderTypes();
    interceptGETPatientDetails();
    interceptPATCHPharmacy({ fixture: 'pharmacyPatch' });
    navigateCareManagerTo({ location: 'PATIENT_PAGE' });
  });

  it('should be able to edit patient pharmacy details', () => {
    el(OPEN_MORE_OPTIONS_BUTTON).click();
    el(EDIT_BUTTON).click();
    el(NAME_INPUT).clear().type('Farmacias del Ahorro');
    el(PHONE_NUMBER_INPUT).clear().type('444');
    el(FAX_INPUT).clear().type('555');
    el(ADDRESS_INPUT).clear().type('17 Terranova Avenue');
    el(SAVE_BUTTON).click();
    el(PATIENT_PHARMACY_NAME).hasText('Farmacias del Ahorro');
    el(PATIENT_PHARMACY_PHONE_NUMBER).hasText('444');
    el(PATIENT_PHARMACY_FAX_NUMBER).hasText('555');
    el(PATIENT_PHARMACY_ADDRESS).hasText('17 Terranova Avenue');
  });
});
