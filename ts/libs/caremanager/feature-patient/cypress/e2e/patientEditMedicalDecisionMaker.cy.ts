import {
  interceptGETPatientDetails,
  interceptGETProviderTypes,
  interceptPATCHMedicalDecisionMaker,
  navigateCareManagerTo,
} from '@*company-data-covered*/caremanager/utils-e2e';
import { el } from '@*company-data-covered*/cypress-shared';

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

describe('caremanager-feature-patient', () => {
  before(() => {
    cy.login();
  });

  beforeEach(() => {
    interceptGETProviderTypes();
    interceptGETPatientDetails();
    interceptPATCHMedicalDecisionMaker({
      fixture: 'medicalDecisionMakerPatch',
    });
    navigateCareManagerTo({ location: 'PATIENT_PAGE' });
  });

  it('should be able to edit patient medical decision maker details', () => {
    el(OPEN_MORE_OPTIONS_BUTTON).click();
    el(EDIT_BUTTON).click();
    el(FIRST_NAME_INPUT).clear().type('Juan');
    el(LAST_NAME_INPUT).clear().type('Pérez');
    el(ADDRESS_INPUT).clear().type('9191 Alcamo Street');
    el(PHONE_NUMBER_INPUT).clear().type('12345');
    el(RELATIONSHIP_INPUT).clear().type('Father');
    el(SAVE_BUTTON).click();
    el(PATIENT_DECISION_MAKER_FIRST_NAME).hasText('Juan');
    el(PATIENT_DECISION_MAKER_LAST_NAME).hasText('Pérez');
    el(PATIENT_DECISION_MAKER_ADDRESS).hasText('9191 Alcamo Street');
    el(PATIENT_DECISION_MAKER_PHONE_NUMBER).hasText('12345');
    el(PATIENT_DECISION_MAKER_RELATIONSHIP).hasText('Father');
  });
});
