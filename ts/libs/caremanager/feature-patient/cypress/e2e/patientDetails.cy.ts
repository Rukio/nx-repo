import {
  interceptGETPatientDetails,
  interceptGETProviderTypes,
  navigateCareManagerTo,
} from '@*company-data-covered*/caremanager/utils-e2e';
import { el } from '@*company-data-covered*/cypress-shared';

const PATIENT_FULL_NAME = 'patient-page-full-name';
const PATIENT_FIRST_NAME = 'patient-demographics-first-name';
const PATIENT_MIDDLE_NAME = 'patient-demographics-middle-name';
const PATIENT_LAST_NAME = 'patient-demographics-last-name';
const PATIENT_DOB = 'patient-demographics-dob';
const PATIENT_SEX = 'patient-demographics-sex';
const PATIENT_ATHENA_ID = 'patient-demographics-athena-id';
const PATIENT_INSURANCE_TITLE = 'patient-insurance-title-205';
const PATIENT_INSURANCE_PAYER = 'patient-insurance-payer-205';
const PATIENT_INSURANCE_MEMBER_ID = 'patient-insurance-member-id-205';
const PATIENT_CONTACT_ADDRESS = 'patient-contact-address';
const PATIENT_CONTACT_PHONE_NUMBER = 'patient-contact-phone-number';
const PATIENT_CONTACT_ADDRESS_NOTES = 'patient-contact-address-notes';
const PATIENT_DECISION_MAKER_FIRST_NAME = 'patient-decision-maker-first-name';
const PATIENT_DECISION_MAKER_LAST_NAME = 'patient-decision-maker-last-name';
const PATIENT_DECISION_MAKER_ADDRESS = 'patient-decision-maker-address';
const PATIENT_DECISION_MAKER_PHONE_NUMBER =
  'patient-decision-maker-phone-number';
const PATIENT_DECISION_MAKER_RELATIONSHIP =
  'patient-decision-maker-relationship';
const PATIENT_PHARMACY_NAME = 'patient-pharmacy-name';
const PATIENT_PHARMACY_PHONE_NUMBER = 'patient-pharmacy-phone-number';
const PATIENT_PHARMACY_FAX_NUMBER = 'patient-pharmacy-fax-number';
const PATIENT_PHARMACY_ADDRESS = 'patient-pharmacy-address';
const PATIENT_PROVIDER_TITLE = 'external-care-provider-card-123-title';
const PATIENT_PROVIDER_NAME = 'patient-provider-name-123';
const PATIENT_PROVIDER_PHONE_NUMBER = 'patient-provider-phone-number-123';
const PATIENT_PROVIDER_FAX_NUMBER = 'patient-provider-fax-number-123';
const PATIENT_PROVIDER_ADDRESS = 'patient-provider-address-123';

describe('caremanager-feature-patient', () => {
  before(() => {
    cy.login();
  });

  beforeEach(() => {
    interceptGETProviderTypes();
    interceptGETPatientDetails();
    navigateCareManagerTo({ location: 'PATIENT_PAGE' });
  });

  it('should display all patient details', () => {
    el(PATIENT_FULL_NAME).hasText('Quincy Hane Smith');

    // demographics card
    el(PATIENT_FIRST_NAME).hasText('Quincy');
    el(PATIENT_MIDDLE_NAME).hasText('Hane');
    el(PATIENT_LAST_NAME).hasText('Smith');
    el(PATIENT_DOB).hasText('01/29/1999');
    el(PATIENT_SEX).hasText('female');
    el(PATIENT_ATHENA_ID).hasText('0123456789');

    // insurance card
    el(PATIENT_INSURANCE_TITLE).hasText('Primary insurance');
    el(PATIENT_INSURANCE_PAYER).hasText('United Healthcare');
    el(PATIENT_INSURANCE_MEMBER_ID).hasText('333');

    // contact card
    el(PATIENT_CONTACT_ADDRESS).hasText(
      '21457 Calvin Islands West Elizabeth, Arizona 44556'
    );
    el(PATIENT_CONTACT_PHONE_NUMBER).hasText('+13035001519');
    el(PATIENT_CONTACT_ADDRESS_NOTES).hasText('Watch the stairs');

    // decision maker card
    el(PATIENT_DECISION_MAKER_FIRST_NAME).hasText('Adam');
    el(PATIENT_DECISION_MAKER_LAST_NAME).hasText('Smith');
    el(PATIENT_DECISION_MAKER_ADDRESS).hasText('44 West Street');
    el(PATIENT_DECISION_MAKER_PHONE_NUMBER).hasText('555');
    el(PATIENT_DECISION_MAKER_RELATIONSHIP).hasText('Teacher');

    // pharmacy card
    el(PATIENT_PHARMACY_NAME).hasText('Farmacias Guadalajara');
    el(PATIENT_PHARMACY_PHONE_NUMBER).hasText('111');
    el(PATIENT_PHARMACY_FAX_NUMBER).hasText('222');
    el(PATIENT_PHARMACY_ADDRESS).hasText('1524 Mexico Avenue');

    // providers card
    el(PATIENT_PROVIDER_TITLE).hasText('Geneticist');
    el(PATIENT_PROVIDER_NAME).hasText('Dr Mephesto');
    el(PATIENT_PROVIDER_PHONE_NUMBER).hasText('666');
    el(PATIENT_PROVIDER_FAX_NUMBER).hasText('777');
    el(PATIENT_PROVIDER_ADDRESS).hasText('Some desert island');
  });
});
