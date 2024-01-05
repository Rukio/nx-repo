import {
  interceptDELETEInsurance,
  interceptGETPatientDetails,
  interceptGETProviderTypes,
  interceptPATCHInsurance,
  interceptPOSTInsurance,
  navigateCareManagerTo,
} from '@*company-data-covered*/caremanager/utils-e2e';
import { el } from '@*company-data-covered*/cypress-shared';

const INSURANCES_CARD = 'patient-insurances-card';
const OPEN_MORE_OPTIONS_BUTTON = 'patient-insurance-205-options-open';
const EDIT_BUTTON = 'details-card-edit-menu-item';
const DELETE_BUTTON = 'details-card-delete-menu-item';
const CONFIRM_DELETE_BUTTON = 'delete-insurance-submit-button';
const INSURANCE_NAME_INPUT = 'name-input';
const INSURANCE_MEMBER_ID_INPUT = 'memberid-input';
const SAVE_BUTTON = 'edit-insurance-save-button';
const ADD_INSURANCE_BUTTON = 'patient-insurances-card-add-button';
const PATIENT_PRIMARY_INSURANCE_TITLE = 'patient-insurance-title-205';
const PATIENT_PRIMARY_INSURANCE_PAYER = 'patient-insurance-payer-205';
const PATIENT_PRIMARY_INSURANCE_MEMBER_ID = 'patient-insurance-member-id-205';
const PATIENT_SECONDARY_INSURANCE_TITLE = 'patient-insurance-title-206';
const PATIENT_SECONDARY_INSURANCE_PAYER = 'patient-insurance-payer-206';
const PATIENT_SECONDARY_INSURANCE_MEMBER_ID = 'patient-insurance-member-id-206';

describe('caremanager-feature-patient', () => {
  before(() => {
    cy.login();
  });

  beforeEach(() => {
    interceptGETProviderTypes();
    interceptGETPatientDetails();
    interceptPATCHInsurance({ fixture: 'primaryInsurancePatch' });
    interceptPOSTInsurance({ fixture: 'secondaryInsurancePost' });
    interceptDELETEInsurance({ fixture: 'primaryInsuranceDelete' });
    navigateCareManagerTo({ location: 'PATIENT_PAGE' });
  });

  it('should be able to edit patient primary insurance details', () => {
    el(OPEN_MORE_OPTIONS_BUTTON).click();
    el(EDIT_BUTTON).click();
    el(INSURANCE_NAME_INPUT).clear().type('Humana');
    el(INSURANCE_MEMBER_ID_INPUT).clear().type('666');
    el(SAVE_BUTTON).click();
    el(PATIENT_PRIMARY_INSURANCE_TITLE).hasText('Primary insurance');
    el(PATIENT_PRIMARY_INSURANCE_PAYER).hasText('Humana');
    el(PATIENT_PRIMARY_INSURANCE_MEMBER_ID).hasText('666');
  });

  it('should be able to add patient secondary insurance', () => {
    el(ADD_INSURANCE_BUTTON).click();
    el(INSURANCE_NAME_INPUT).clear().type('Medicare');
    el(INSURANCE_MEMBER_ID_INPUT).clear().type('777');
    el(SAVE_BUTTON).click();
    el(PATIENT_SECONDARY_INSURANCE_TITLE).hasText('Secondary insurance');
    el(PATIENT_SECONDARY_INSURANCE_PAYER).hasText('Medicare');
    el(PATIENT_SECONDARY_INSURANCE_MEMBER_ID).hasText('777');
  });

  it('should be able to delete an insurance', () => {
    cy.wait('@interceptGETPatientDetails').then(() => {
      el(OPEN_MORE_OPTIONS_BUTTON).click();
      el(DELETE_BUTTON).click();
      el(CONFIRM_DELETE_BUTTON).click();
      el(INSURANCES_CARD).hasText('There is no insurance information yet');
    });
  });
});
