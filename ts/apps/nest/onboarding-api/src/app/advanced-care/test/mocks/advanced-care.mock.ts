import {
  AdvancedCarePatient,
  CMAdvancedCarePatient,
} from '@*company-data-covered*/consumer-web-types';

export const MOCK_ADVANCED_CARE_PATIENT: AdvancedCarePatient = {
  id: '60',
  athenaId: '3239',
  firstName: 'Aide',
  middleName: 'Wehner',
  lastName: 'Gleason',
  dateOfBirth: '2012-04-29',
  sex: '1',
  phoneNumber: '303-500-1518',
  athenaMedicalRecordNumber: '3239',
  payer: 'Innovage',
  preferredPharmacyDetails: 'Grane',
  doctorDetails: 'Anthony Aron PCP Fax: 720-917-3355',
  addressStreet: '4195 Carolann Village',
  addressStreet2: '112',
  city: 'Reubenshire',
  state: 'New Mexico',
  zipcode: '77294',
  notes: 'Gate code 1535',
};

export const MOCK_ADVANCED_CARE_PATIENT_DATA: AdvancedCarePatient[] = [
  MOCK_ADVANCED_CARE_PATIENT,
];

export const MOCK_CM_ADVANCED_CARE_PATIENT_DATA: CMAdvancedCarePatient[] = [
  {
    id: MOCK_ADVANCED_CARE_PATIENT.id,
    athena_id: MOCK_ADVANCED_CARE_PATIENT.athenaId,
    first_name: MOCK_ADVANCED_CARE_PATIENT.firstName,
    middle_name: MOCK_ADVANCED_CARE_PATIENT.middleName,
    last_name: MOCK_ADVANCED_CARE_PATIENT.lastName,
    date_of_birth: MOCK_ADVANCED_CARE_PATIENT.dateOfBirth,
    sex: MOCK_ADVANCED_CARE_PATIENT.sex,
    phone_number: MOCK_ADVANCED_CARE_PATIENT.phoneNumber,
    athena_medical_record_number:
      MOCK_ADVANCED_CARE_PATIENT.athenaMedicalRecordNumber,
    payer: MOCK_ADVANCED_CARE_PATIENT.payer,
    preferred_pharmacy_details:
      MOCK_ADVANCED_CARE_PATIENT.preferredPharmacyDetails,
    doctor_details: MOCK_ADVANCED_CARE_PATIENT.doctorDetails,
    address_street: MOCK_ADVANCED_CARE_PATIENT.addressStreet,
    address_street_2: MOCK_ADVANCED_CARE_PATIENT.addressStreet2,
    address_city: MOCK_ADVANCED_CARE_PATIENT.city,
    address_state: MOCK_ADVANCED_CARE_PATIENT.state,
    address_zipcode: MOCK_ADVANCED_CARE_PATIENT.zipcode,
    address_notes: MOCK_ADVANCED_CARE_PATIENT.notes,
  },
];
