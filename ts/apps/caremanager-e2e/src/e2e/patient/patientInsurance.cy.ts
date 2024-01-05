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
} from '../helpers/caremanagerHelper';
import { navigateTo } from '../helpers/navigationHelper';

/* Selectors */
const EDIT_BUTTON = 'details-card-edit-menu-item';
const DELETE_BUTTON = 'details-card-delete-menu-item';
const CONFIRM_DELETE_BUTTON = 'delete-insurance-submit-button';
const INSURANCE_NAME_INPUT = 'name-input';
const INSURANCE_MEMBER_ID_INPUT = 'memberid-input';
const SAVE_BUTTON = 'edit-insurance-save-button';
const ADD_INSURANCE_BUTTON = 'patient-insurances-card-add-button';
const PRIMARY_INSURANCE_NAME = faker.company.name();
const PRIMARY_MEMBER_ID = faker.random.numeric(5);
const SECONDARY_PAYER_ID = faker.name.firstName();
const SECONDARY_MEMBER_ID = faker.random.numeric(5);
const TERTIARY_PAYER_ID = faker.name.firstName();
const TERTIARY_MEMBER_ID = faker.random.numeric(5);

function openMoreOptionsButton(id: string) {
  return `patient-insurance-${id}-options-open`;
}
function patientPrimaryInsuranceTitle(id: string) {
  return `patient-insurance-title-${id}`;
}
function patientPrimaryInsurancePayer(id: string) {
  return `patient-insurance-payer-${id}`;
}
function patientPrimaryInsuranceMemberId(id: string) {
  return `patient-insurance-member-id-${id}`;
}
function patientSecondaryInsurancePayer(id: string) {
  return `patient-insurance-payer-${id}`;
}
function patientSecondaryInsuranceMemberId(id: string) {
  return `patient-insurance-member-id-${id}`;
}

/* Helpers */

const ifInsuranceExistDelete = (secondary: string, tertiary?: string) => {
  if (typeof tertiary !== 'undefined') {
    deleteInsurance(tertiary);
  }
  if (typeof secondary !== 'undefined') {
    deleteInsurance(secondary);
  }
};

const deleteInsurance = (insurance: string) => {
  el(openMoreOptionsButton(insurance)).click();
  el(DELETE_BUTTON).click();
  el(CONFIRM_DELETE_BUTTON).click();
};

const createSecondaryInsurance = () => {
  el(ADD_INSURANCE_BUTTON).click();
  el(INSURANCE_NAME_INPUT).first().type(SECONDARY_PAYER_ID);
  el(INSURANCE_MEMBER_ID_INPUT).type(SECONDARY_MEMBER_ID);
  el(SAVE_BUTTON).click();
};

describe('Patient Insurance', () => {
  let insuranceId: string, insuranceName: string, memberId: string;

  before(() => {
    cy.login();
  });
  beforeEach(() => {
    navigateTo({ location: 'EPISODES_HOMEPAGE' });
    interceptGETPatientData({ mockResp: false });
    interceptGETEpisodes({ mockResp: false });

    el(CLEAR_BUTTON).click({ force: true });
    cy.wait('@interceptGETEpisodes')
      .its('response.body')
      .then((response) => {
        el(getPatientDetailsLink(response.episodes[0].patient_id))
          .first()
          .click();
      });
    el(FULL_PATIENT_DETAILS_BUTTON).click();

    cy.wait('@interceptGETPatientData').then(({ response }) => {
      const [insurance] = response.body.insurances;

      insuranceId = insurance.id;
      insuranceName = insurance.name;
      memberId = insurance.member_id;

      const secondaryId = response?.body?.insurances[1]?.id;
      const tertiaryId = response?.body?.insurances[2]?.id;

      ifInsuranceExistDelete(tertiaryId, secondaryId);
    });
  });

  it('should verify existing patient insurance details', () => {
    el(patientPrimaryInsuranceTitle(insuranceId)).hasText('Primary insurance');
    el(patientPrimaryInsurancePayer(insuranceId)).hasText(insuranceName);
    el(patientPrimaryInsuranceMemberId(insuranceId)).hasText(memberId);
  });

  it('should edit new patient insurance details', () => {
    el(openMoreOptionsButton(insuranceId)).click();
    el(EDIT_BUTTON).click();
    el(INSURANCE_NAME_INPUT).clear().type(PRIMARY_INSURANCE_NAME);
    el(INSURANCE_MEMBER_ID_INPUT).clear().type(PRIMARY_MEMBER_ID);
    el(SAVE_BUTTON).click();
    el(patientPrimaryInsurancePayer(insuranceId)).hasText(
      PRIMARY_INSURANCE_NAME
    );
    el(patientPrimaryInsuranceMemberId(insuranceId)).hasText(PRIMARY_MEMBER_ID);
  });

  it('should create new secondary insurance details', () => {
    interceptPOSTInsurance({ mockResp: false });
    createSecondaryInsurance();
    cy.wait('@interceptPOSTInsurance').then((request) => {
      const { id } = request.response.body.patient_insurances[1];
      const secondaryInsuranceId = id;
      el(patientSecondaryInsurancePayer(secondaryInsuranceId)).hasText(
        SECONDARY_PAYER_ID
      );
      el(patientSecondaryInsuranceMemberId(secondaryInsuranceId)).hasText(
        SECONDARY_MEMBER_ID
      );
    });
  });

  it('should create new tertiary insurance details', () => {
    createSecondaryInsurance();
    el(ADD_INSURANCE_BUTTON).click();
    el(INSURANCE_NAME_INPUT).first().type(TERTIARY_PAYER_ID);
    el(INSURANCE_MEMBER_ID_INPUT).type(TERTIARY_MEMBER_ID);
    interceptPOSTInsurance({ mockResp: false });
    el(SAVE_BUTTON).click();
    cy.wait('@interceptPOSTInsurance').then((request) => {
      const { id } = request.response.body.patient_insurances[2];
      const tertiaryInsuranceId = id;
      el(patientSecondaryInsurancePayer(tertiaryInsuranceId)).hasText(
        TERTIARY_PAYER_ID
      );
      el(patientSecondaryInsuranceMemberId(tertiaryInsuranceId)).hasText(
        TERTIARY_MEMBER_ID
      );
    });
  });

  it('should delete secondary and tertiary insurance', () => {
    /*Before Each hook deletes any insurance before test begins*/
    el(ADD_INSURANCE_BUTTON).hasText('Add Secondary');
  });
});
