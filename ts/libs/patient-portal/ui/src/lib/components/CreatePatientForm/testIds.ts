export const CREATE_PATIENT_FORM_TEST_IDS = {
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
  GENDER_IDENTITY_FORM_CONTROL:
    'create-patient-form-gender-identity-form-control',
  GENDER_IDENTITY: 'create-patient-form-gender-identity',
  getCreatePatientFormGenderIdentityOptionTestId: (option: string) =>
    `create-patient-form-gender-identity-option-${option}`,
  SUBMIT_BUTTON: 'create-patient-submit-button',
};
