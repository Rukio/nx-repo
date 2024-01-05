import {
  AdvancedCarePatient,
  CMAdvancedCarePatient,
} from '@*company-data-covered*/consumer-web-types';

const SearchActivePatientsQuery = (input: string) => {
  return {
    athena_ids: input,
  };
};

const mapCMAdvancedPatientToAdvancedPatient = (
  input: CMAdvancedCarePatient
): AdvancedCarePatient => {
  return {
    id: input.id,
    athenaId: input.athena_id,
    firstName: input.first_name,
    middleName: input.middle_name,
    lastName: input.last_name,
    dateOfBirth: input.date_of_birth,
    sex: input.sex,
    phoneNumber: input.phone_number,
    athenaMedicalRecordNumber: input.athena_medical_record_number,
    payer: input.payer,
    preferredPharmacyDetails: input.preferred_pharmacy_details,
    doctorDetails: input.doctor_details,
    addressStreet: input.address_street,
    addressStreet2: input.address_street_2,
    city: input.address_city,
    state: input.address_state,
    zipcode: input.address_zipcode,
    notes: input.address_notes,
  };
};

export default {
  SearchActivePatientsQuery,
  mapCMAdvancedPatientToAdvancedPatient,
};
