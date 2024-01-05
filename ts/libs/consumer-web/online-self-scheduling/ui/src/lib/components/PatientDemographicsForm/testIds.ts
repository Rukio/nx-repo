// TODO(ON-897): move formatValue to shared util library
const formatValue = (value: string) => value.toLowerCase().replace(/\s/g, `-`);

const patientDemographicsFormPrefix = 'patient-demographics-form';

const patientLegalSexSelectItemPrefix = `${patientDemographicsFormPrefix}-patient-legal-sex-select-item`;
const patientAssignedSexAtBirthSelectItemPrefix = `${patientDemographicsFormPrefix}-patient-assigned-sex-at-birth-select-item`;
const patientGenderIdentitySelectItemPrefix = `${patientDemographicsFormPrefix}-patient-gender-identity-select-item`;

export const PATIENT_DEMOGRAPHICS_FORM_TEST_IDS = {
  ROOT: `${patientDemographicsFormPrefix}-root`,
  RETURNING_PATIENT_SECTION: `${patientDemographicsFormPrefix}-returning-patient-section`,
  REQUESTER_SECTION: `${patientDemographicsFormPrefix}-requester-section`,
  PATIENT_SECTION: `${patientDemographicsFormPrefix}-patient-section`,
  PATIENT_SEX_AND_GENDER_DETAILS_COLLAPSE_SECTION: `${patientDemographicsFormPrefix}-patient-sex-and-gender-details-collapse-section`,
  REQUESTER_FULL_LEGAL_NAME_LABEL: `${patientDemographicsFormPrefix}-requester-full-legal-name-label`,
  REQUESTER_PHONE_NUMBER_LABEL: `${patientDemographicsFormPrefix}-requester-phone-number-label`,
  REQUESTER_FIRST_NAME_FIELD: `${patientDemographicsFormPrefix}-requester-first-name-field`,
  REQUESTER_FIRST_NAME_INPUT: `${patientDemographicsFormPrefix}-requester-first-name-input`,
  REQUESTER_LAST_NAME_FIELD: `${patientDemographicsFormPrefix}-requester-last-name-field`,
  REQUESTER_LAST_NAME_INPUT: `${patientDemographicsFormPrefix}-requester-last-name-input`,
  REQUESTER_PHONE_NUMBER_FIELD: `${patientDemographicsFormPrefix}-requester-phone-number-field`,
  REQUESTER_PHONE_NUMBER_INPUT: `${patientDemographicsFormPrefix}-requester-phone-number-input`,
  PATIENT_FIRST_NAME_FIELD: `${patientDemographicsFormPrefix}-patient-first-name-field`,
  PATIENT_FULL_LEGAL_NAME_LABEL: `${patientDemographicsFormPrefix}-patient-full-legal-name-label`,
  PATIENT_PHONE_NUMBER_LABEL: `${patientDemographicsFormPrefix}-patient-phone-number-label`,
  PATIENT_DATE_OF_BIRTH_LABEL: `${patientDemographicsFormPrefix}-patient-date-of-birth-label`,
  PATIENT_LEGAL_SEX_LABEL: `${patientDemographicsFormPrefix}-patient-legal-sex-label`,
  PATIENT_ASSIGNED_SEX_AT_BIRTH_LABEL: `${patientDemographicsFormPrefix}-patient-assigned-sex-at-birth-label`,
  PATIENT_GENDER_IDENTITY_LABEL: `${patientDemographicsFormPrefix}-patient-gender-identity-label`,
  PATIENT_GENDER_IDENTITY_DETAILS_LABEL: `${patientDemographicsFormPrefix}-patient-gender-identity-details-label`,
  PATIENT_FIRST_NAME_INPUT: `${patientDemographicsFormPrefix}-patient-first-name-input`,
  PATIENT_MIDDLE_NAME_FIELD: `${patientDemographicsFormPrefix}-patient-middle-name-field`,
  PATIENT_MIDDLE_NAME_INPUT: `${patientDemographicsFormPrefix}-patient-middle-name-input`,
  PATIENT_LAST_NAME_FIELD: `${patientDemographicsFormPrefix}-patient-last-name-field`,
  PATIENT_LAST_NAME_INPUT: `${patientDemographicsFormPrefix}-patient-last-name-input`,
  PATIENT_SUFFIX_FIELD: `${patientDemographicsFormPrefix}-patient-suffix-field`,
  PATIENT_SUFFIX_INPUT: `${patientDemographicsFormPrefix}-patient-suffix-input`,
  PATIENT_PHONE_NUMBER_FIELD: `${patientDemographicsFormPrefix}-patient-phone-number-field`,
  PATIENT_PHONE_NUMBER_INPUT: `${patientDemographicsFormPrefix}-patient-phone-number-input`,
  PATIENT_DATE_OF_BIRTH_FIELD: `${patientDemographicsFormPrefix}-patient-date-of-birth-field`,
  PATIENT_DATE_OF_BIRTH_INPUT: `${patientDemographicsFormPrefix}-patient-date-of-birth-input`,
  PATIENT_LEGAL_SEX_FIELD: `${patientDemographicsFormPrefix}-patient-legal-sex-field`,
  PATIENT_LEGAL_SEX_INPUT: `${patientDemographicsFormPrefix}-patient-legal-sex-input`,
  PATIENT_LEGAL_SEX_SELECT_ITEM_PREFIX: patientLegalSexSelectItemPrefix,
  getPatientLegalSexSelectItem: (value: string) =>
    `${patientLegalSexSelectItemPrefix}-${formatValue(value)}`,
  PATIENT_ASSIGNED_SEX_AT_BIRTH_FIELD: `${patientDemographicsFormPrefix}-patient-assigned-sex-at-birth-field`,
  PATIENT_ASSIGNED_SEX_AT_BIRTH_INPUT: `${patientDemographicsFormPrefix}-patient-assigned-sex-at-birth-input`,
  PATIENT_ASSIGNED_SEX_AT_BIRTH_SELECT_ITEM_PREFIX:
    patientAssignedSexAtBirthSelectItemPrefix,
  getPatientAssignedSexAtBirthSelectItem: (value: string) =>
    `${patientAssignedSexAtBirthSelectItemPrefix}-${formatValue(value)}`,
  PATIENT_GENDER_IDENTITY_FIELD: `${patientDemographicsFormPrefix}-patient-gender-identity-field`,
  PATIENT_GENDER_IDENTITY_INPUT: `${patientDemographicsFormPrefix}-patient-gender-identity-input`,
  PATIENT_GENDER_IDENTITY_SELECT_ITEM_PREFIX:
    patientGenderIdentitySelectItemPrefix,
  getPatientGenderIdentitySelectItem: (value: string) =>
    `${patientGenderIdentitySelectItemPrefix}-${formatValue(value)}`,
  getReturningPatientRadioOption: (value: string) =>
    `${patientDemographicsFormPrefix}-returning-patient-radio-option-${formatValue(
      value
    )}`,
  PATIENT_GENDER_IDENTITY_DETAILS_FIELD: `${patientDemographicsFormPrefix}-patient-gender-identity-details-field`,
  PATIENT_GENDER_IDENTITY_DETAILS_INPUT: `${patientDemographicsFormPrefix}-patient-gender-identity-details-input`,
  PATIENT_FULL_LEGAL_NAME_ALERT: `${patientDemographicsFormPrefix}-patient-full-legal-name-alert`,
  PATIENT_ADD_SEX_AND_GENDER_DETAILS_BUTTON: `${patientDemographicsFormPrefix}-patient-add-sex-and-gender-details-button`,
};
