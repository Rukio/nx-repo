//TODO: PT-1549 import this from shared lib
// App Bar
export const APP_BAR_CONTAINER = 'app-bar-container';

export const APP_BAR_DISPATCH_HEALTH_LOGO_LINK =
  'app-bar-dispatch-health-logo-link';

export const CREATE_PATIENT_PAGE_TEST_IDS = {
  PAGE: 'create-patient-page',
  BACK_BUTTON: 'create-patient-form-title-page-section-back-button',
  TITLE: 'create-patient-form-title-page-section-title',
  FIRST_NAME_FORM_CONTROL: 'create-patient-form-first-name-form-control',
  FIRST_NAME: 'create-patient-form-first-name',
  LAST_NAME_FORM_CONTROL: 'create-patient-form-last-name-form-control',
  LAST_NAME: 'create-patient-form-last-name',
  PHONE_NUMBER_FORM_CONTROL: 'create-patient-form-phone-number-form-control',
  PHONE_NUMBER: 'create-patient-form-phone-number',
  DATE_OF_BIRTH_FORM_CONTROL: 'create-patient-form-date-of-birth-form-control',
  DATE_OF_BIRTH: 'create-patient-form-date-of-birth',
  ASSIGNED_SEX_FORM_CONTROL: 'create-patient-form-assigned-sex-form-control',
  ASSIGNED_SEX: 'create-patient-form-assigned-sex',
  getCreatePatientFormAssignedSexOptionTestId: (option: string) =>
    `create-patient-form-assigned-sex-option-${option}`,
  GENDER_IDENTITY_FORM_CONTROL: 'create-patient-form-assigned-sex',
  GENDER_IDENTITY: 'create-patient-form-gender-identity',
  getCreatePatientFormGenderIdentityOptionTestId: (option: string) =>
    `create-patient-form-gender-identity-option-${option}`,
  SUBMIT_BUTTON: 'create-patient-submit-button',
};

export const CREATE_ADDRESS_FORM_TEST_IDS = {
  PAGE: 'create-address-page',
  BACK_BUTTON: 'create-address-form-title-page-section-back-button',
  TITLE: 'create-address-form-title-page-section-title',
  STREET_ADDRESS_1_FORM_CONTROL:
    'create-address-form-street-address-1-form-control',
  STREET_ADDRESS_1_INPUT: 'create-address-form-street-address-1-input',
  STREET_ADDRESS_2_FORM_CONTROL:
    'create-address-form-street-address-2-form-control',
  STREET_ADDRESS_2_INPUT: 'create-address-form-street-address-2-input',
  LOCATION_DETAILS_FORM_CONTROL:
    'create-address-form-location-details-form-control',
  LOCATION_DETAILS_INPUT: 'create-address-form-location-details-input',
  CITY_FORM_CONTROL: 'create-address-form-city-form-control',
  CITY_INPUT: 'create-address-form-city-input',
  STATE_FORM_CONTROL: 'create-address-form-state-form-control',
  STATE: 'create-address-form-state',
  getCreateAddressFormStateOptionTestId: (option: string) =>
    `create-address-form-state-option-${option}`,
  ZIP_CODE_CONTROL: 'create-address-form-zip-code-form-control',
  ZIP_CODE_INPUT: 'create-address-form-zip-code-input',
  SUBMIT_BUTTON: 'create-address-submit-button',
};

export const LANDING_PAGE_TEST_IDS = {
  PAGE: 'landing-page-page',
  MY_SETTINGS_SECTION: 'my-settings-section',
  SAVED_ADDRESSED_SECTION_TITLE:
    'saved-addresses-page-title-page-section-title',
  SAVED_ADDRESSED_SECTION_SUBTITLE:
    'saved-addresses-page-title-page-section-subtitle',
};

export const PATIENT_DETAILS_TEST_IDS = {
  PAGE: 'patient-details-page',
  BACK_BUTTON: 'patient-details-title-page-section-back-button',
  TITLE: 'patient-details-title-page-section-title',
  NAME_ITEM: 'patient-details-name-formatted-list-list-item',
  NAME_VALUE:
    'patient-details-name-formatted-list-list-item-children-container',
  NAME_ITEM_BUTTON: 'patient-details-name-formatted-list-list-item-icon-button',
  EMAIL_ITEM: 'patient-details-email-formatted-list-list-item',
  EMAIL_VALUE:
    'patient-details-email-formatted-list-list-item-children-container',
  EMAIL_ITEM_BUTTON: 'patient-details-email-formatted-list-list-item-button',
  PHONE_NUMBER_ITEM: 'patient-details-phone-number-formatted-list-list-item',
  PHONE_NUMBER_VALUE:
    'patient-details-phone-number-formatted-list-list-item-children-container',
  PHONE_NUMBER_ITEM_BUTTON:
    'patient-details-phone-number-formatted-list-list-item-button',
  DOB_ITEM: 'patient-details-dob-formatted-list-list-item',
  DOB_VALUE: 'patient-details-dob-formatted-list-list-item-children-container',
  DOB_ITEM_BUTTON: 'patient-details-dob-formatted-list-list-item-icon-button',
  LEGAL_SEX_ITEM: 'patient-details-legal-sex-formatted-list-list-item',
  LEGAL_SEX_VALUE:
    'patient-details-legal-sex-formatted-list-list-item-children-container',
  LEGAL_SEX_ITEM_BUTTON:
    'patient-details-legal-sex-formatted-list-list-item-button',
  ASSIGNED_SEX_AT_BIRTH_ITEM:
    'patient-details-assigned-sex-at-birth-formatted-list-list-item',
  ASSIGNED_SEX_AT_BIRTH_VALUE:
    'patient-details-assigned-sex-at-birth-formatted-list-list-item-children-container',
  ASSIGNED_SEX_AT_BIRTH_ITEM_BUTTON:
    'patient-details-assigned-sex-at-birth-formatted-list-list-item-button',
  GENDER_IDENTITY_ITEM:
    'patient-details-gender-identity-formatted-list-list-item',
  GENDER_IDENTITY_VALUE:
    'patient-details-gender-identity-formatted-list-list-item-children-container',
  GENDER_IDENTITY_ITEM_BUTTON:
    'patient-details-gender-identity-formatted-list-list-item-button',
  REMOVE_PATIENT_BUTTON:
    'patient-details-remove-patient-button-settings-list-button-list-item-button',
  DELETE_CONFIRMATION_MODAL: 'delete-confirmation-modal-modal',
  DELETE_CONFIRMATION_MODAL_TITLE: 'delete-confirmation-modal-modal-title',
  DELETE_CONFIRMATION_MODAL_CLOSE_BUTTON:
    'delete-confirmation-modal-modal-close-button',
  DELETE_CONFIRMATION_MODAL_ALERT: 'delete-confirmation-confirmation-alert',
  DELETE_CONFIRMATION_MODAL_SUBMIT_BUTTON:
    'delete-confirmation-confirmation-button',
};
