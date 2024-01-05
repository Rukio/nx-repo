import {
  interceptGETPatientData,
  interceptPOSTExternalCareProviders,
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

const DELETE_BUTTON = 'delete-external-care-provider-submit-button';
const ADD_TEAM_MEMBER = 'add-external-care-team-member';
const PROVIDER_TYPE_DROPDOWNLIST = 'provider-type-select-container';
const PROVIDER_TYPE_DOCTOR = 'providertypeid-doctor-option';
const PROVIDER_TYPE_PCP = 'providertypeid-pcp-option';
const NAME_INPUT = 'name-input';
const FAX_NUMBER_INPUT = 'faxnumber-input';
const ADDRESS_INPUT = 'address-input';
const PHONE_NUMBER_INPUT = 'phonenumber-input';
const SAVE_BUTTON = 'edit-external-care-provider-save-button';
const NEW_NAME = faker.name.firstName();
const NEW_FAX_NUMBER = faker.phone.number('1562#######');
const NEW_STREET_ADDRESS = faker.address.streetAddress();
const NEW_PHONE_NUMBER = faker.phone.number('1562#######');
function patientProviderName(id: string) {
  return `patient-provider-name-${id}`;
}
function patientProviderPhoneNumber(id: string) {
  return `patient-provider-phone-number-${id}`;
}
function patientProviderFaxNumber(id: string) {
  return `patient-provider-fax-number-${id}`;
}
function patientProviderAddress(id: string) {
  return `patient-provider-address-${id}`;
}
function openMoreOptionsButton(id: string) {
  return `external-care-provider-card-${id}-options-open`;
}
function externalCareTeamEditButton(id: string) {
  return `external-care-provider-card-${id}-options-edit-menu-item`;
}
function openEditExternalTeamButton(id: string) {
  return `external-care-provider-card-${id}-options-open`;
}
function externalTeamDeleteButton(id: string) {
  return `external-care-provider-card-${id}-options-delete-menu-item`;
}

function verifyPatientExternalTeamEdits(id: string) {
  el(patientProviderName(id)).hasText(NEW_NAME);
  el(patientProviderPhoneNumber(id)).hasText(NEW_PHONE_NUMBER);
  el(patientProviderFaxNumber(id)).hasText(NEW_FAX_NUMBER);
  el(patientProviderAddress(id)).hasText(NEW_STREET_ADDRESS);
}

describe('Patient Medical Decision Maker', () => {
  before(() => {
    cy.login();
  });

  beforeEach(() => {
    navigateTo({ location: 'EPISODES_HOMEPAGE' });
    interceptGETPatientData({ mockResp: false });
    interceptPOSTExternalCareProviders({ mockResp: false });
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
  });

  it('should create new team member', () => {
    el(ADD_TEAM_MEMBER).click();
    el(PROVIDER_TYPE_DROPDOWNLIST).click();
    el(PROVIDER_TYPE_DOCTOR).click();
    el(NAME_INPUT).clear().type(NEW_NAME);
    el(PHONE_NUMBER_INPUT).clear().type(NEW_PHONE_NUMBER);
    el(FAX_NUMBER_INPUT).clear().type(NEW_FAX_NUMBER);
    el(ADDRESS_INPUT).clear().type(NEW_STREET_ADDRESS);
    el(SAVE_BUTTON).click();
    cy.wait('@interceptPOSTExternalCareProviders').then((request) => {
      const { id } = request.response.body.external_care_provider;
      verifyPatientExternalTeamEdits(id);
    });
  });

  it('should edit a team member', () => {
    cy.wait('@interceptGETPatientData').then((request) => {
      const { id } = request.response.body.external_care_providers[0];
      el(openMoreOptionsButton(id)).click();
      el(externalCareTeamEditButton(id)).click({ force: true });
      el(PROVIDER_TYPE_DROPDOWNLIST).click();
      el(PROVIDER_TYPE_PCP).click();
      el(NAME_INPUT).clear().type(NEW_NAME);
      el(PHONE_NUMBER_INPUT).clear().type(NEW_PHONE_NUMBER);
      el(FAX_NUMBER_INPUT).clear().type(NEW_FAX_NUMBER);
      el(ADDRESS_INPUT).clear().type(NEW_STREET_ADDRESS);
      el(SAVE_BUTTON).click();
      verifyPatientExternalTeamEdits(id);
    });
  });

  it('should delete a team member', () => {
    cy.wait('@interceptGETPatientData').then((request) => {
      const { id } = request.response.body.external_care_providers[0];
      el(openEditExternalTeamButton(id)).click();
      el(externalTeamDeleteButton(id)).click();
      el(DELETE_BUTTON).click();
      el(patientProviderName(id)).should('not.exist');
    });
  });
});
