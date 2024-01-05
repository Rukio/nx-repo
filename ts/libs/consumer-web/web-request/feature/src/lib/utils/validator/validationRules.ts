export const PATIENT_ELSE_VALIDATION_RULE = {
  firstName: 'required|string',
  lastName: 'required|string',
  phone: 'required|phone',
  birthday: 'birthday',
  sex: 'required',
  relationshipToPatient: 'required',
};

export const PATIENT_MYSELF_VALIDATION_RULE = {
  birthday: 'required|birthday',
  sex: 'required',
  relationshipToPatient: 'required',
};

export const CALLER_VALIDATION_RULE = {
  relationshipToPatient: 'required',
  firstName: 'required|string',
  lastName: 'required|string',
  phone: 'phone',
};

export const ADDRESS_VALIDATION_RULE = {
  streetAddress1: 'required',
  city: 'required',
  state: 'required',
  postalCode: 'required',
};

export const COMPLAINT_VALIDATION_RULE = {
  symptoms: 'required',
};

export const PREFERRED_ETA_VALIDATION_RULE = {
  patientPreferredEtaStart: 'required',
  patientPreferredEtaEnd: 'required',
};

export const INSURANCE_VALIDATION_RULE = {
  memberId: 'required',
  insuranceProvider: 'required',
};
