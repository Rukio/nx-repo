import {
  interceptDELETEExternalCareProviders,
  interceptGETPatientDetails,
  interceptGETProviderTypes,
  interceptPATCHExternalCareProviders,
  interceptPOSTExternalCareProviders,
  navigateCareManagerTo,
} from '@*company-data-covered*/caremanager/utils-e2e';
import { el } from '@*company-data-covered*/cypress-shared';

const OPEN_MORE_OPTIONS_BUTTON = 'external-care-provider-card-123-options-open';
const EDIT_BUTTON = 'external-care-provider-card-123-options-edit-menu-item';
const DELETE_BUTTON =
  'external-care-provider-card-123-options-delete-menu-item';
const CONFIRM_DELETE_BUTTON = 'delete-external-care-provider-submit-button';
const TYPE_SELECT = 'provider-type-select-container';
const CHARLATAN_OPTION = 'providertypeid-charlatan-option';
const NAME_INPUT = 'name-input';
const PHONE_NUMBER_INPUT = 'phonenumber-input';
const FAX_NUMBER_INPUT = 'faxnumber-input';
const ADDRESS_INPUT = 'address-input';
const SAVE_BUTTON = 'edit-external-care-provider-save-button';
const PATIENT_PROVIDER_TITLE_1 = 'external-care-provider-card-123-title';
const PATIENT_PROVIDER_NAME_1 = 'patient-provider-name-123';
const PATIENT_PROVIDER_PHONE_NUMBER_1 = 'patient-provider-phone-number-123';
const PATIENT_PROVIDER_FAX_NUMBER_1 = 'patient-provider-fax-number-123';
const PATIENT_PROVIDER_ADDRESS_1 = 'patient-provider-address-123';
const PATIENT_PROVIDER_TITLE_2 = 'external-care-provider-card-124-title';
const PATIENT_PROVIDER_NAME_2 = 'patient-provider-name-124';
const PATIENT_PROVIDER_PHONE_NUMBER_2 = 'patient-provider-phone-number-124';
const PATIENT_PROVIDER_FAX_NUMBER_2 = 'patient-provider-fax-number-124';
const PATIENT_PROVIDER_ADDRESS_2 = 'patient-provider-address-124';
const ADD_MEMBER_BUTTON = 'add-external-care-team-member';
const PSYCHIATRIST_OPTION = 'providertypeid-psychiatrist-option';
const EXTERNAL_CARE_TEAM_CONTAINER = 'patient-external-care-team';

describe('caremanager-feature-patient', () => {
  before(() => {
    cy.login();
  });

  beforeEach(() => {
    interceptGETProviderTypes();
    interceptGETPatientDetails();
    interceptPATCHExternalCareProviders({
      fixture: 'externalCareProviderPatch',
    });
    interceptPOSTExternalCareProviders({
      fixture: 'externalCareProviderPost',
    });
    interceptDELETEExternalCareProviders({
      fixture: 'externalCareProviderDelete',
    });
    navigateCareManagerTo({ location: 'PATIENT_PAGE' });
  });

  it('should be able to edit a care team entry details', () => {
    el(OPEN_MORE_OPTIONS_BUTTON).click();
    el(EDIT_BUTTON).click();
    el(TYPE_SELECT).click();
    el(CHARLATAN_OPTION).click();
    el(NAME_INPUT).clear().type('Dr Strange');
    el(PHONE_NUMBER_INPUT).clear().type('1234');
    el(FAX_NUMBER_INPUT).clear().type('5678');
    el(ADDRESS_INPUT).clear().type('Multiverse nonsense');
    el(SAVE_BUTTON).click();
    el(PATIENT_PROVIDER_TITLE_1).hasText('Charlatan');
    el(PATIENT_PROVIDER_NAME_1).hasText('Dr Strange');
    el(PATIENT_PROVIDER_PHONE_NUMBER_1).hasText('1234');
    el(PATIENT_PROVIDER_FAX_NUMBER_1).hasText('5678');
    el(PATIENT_PROVIDER_ADDRESS_1).hasText('Multiverse nonsense');
  });

  it('should be able to add a care team entry', () => {
    cy.wait('@interceptGETPatientDetails').then(() => {
      el(ADD_MEMBER_BUTTON).click();
      el(TYPE_SELECT).click();
      el(PSYCHIATRIST_OPTION).click();
      el(NAME_INPUT).clear().type('Dr Hannibal Lecter');
      el(PHONE_NUMBER_INPUT).clear().type('9876');
      el(FAX_NUMBER_INPUT).clear().type('5432');
      el(ADDRESS_INPUT)
        .clear()
        .type('Baltimore State Hospital for the Criminally Insane');
      el(SAVE_BUTTON).click();
      el(PATIENT_PROVIDER_TITLE_1).hasText('Geneticist');
      el(PATIENT_PROVIDER_NAME_1).hasText('Dr Mephesto');
      el(PATIENT_PROVIDER_PHONE_NUMBER_1).hasText('666');
      el(PATIENT_PROVIDER_FAX_NUMBER_1).hasText('777');
      el(PATIENT_PROVIDER_ADDRESS_1).hasText('Some desert island');
      el(PATIENT_PROVIDER_TITLE_2).hasText('Psychiatrist');
      el(PATIENT_PROVIDER_NAME_2).hasText('Dr Hannibal Lecter');
      el(PATIENT_PROVIDER_PHONE_NUMBER_2).hasText('9876');
      el(PATIENT_PROVIDER_FAX_NUMBER_2).hasText('5432');
      el(PATIENT_PROVIDER_ADDRESS_2).hasText(
        'Baltimore State Hospital for the Criminally Insane'
      );
    });
  });

  it('should be able to delete a care team entry', () => {
    cy.wait('@interceptGETPatientDetails').then(() => {
      el(OPEN_MORE_OPTIONS_BUTTON).click();
      el(DELETE_BUTTON).click();
      el(CONFIRM_DELETE_BUTTON).click();
      el(EXTERNAL_CARE_TEAM_CONTAINER).hasText(
        'No one has been added to the External Care Team yet'
      );
    });
  });
});
