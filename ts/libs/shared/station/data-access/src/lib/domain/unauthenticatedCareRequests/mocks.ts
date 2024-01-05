import {
  UnauthenticatedCareRequestResult,
  CreateUnauthenticatedCareRequestDataPayload,
} from '../../types';

export const mockCareRequestResult: UnauthenticatedCareRequestResult = {
  success: true,
  care_request_id: '824e7861-4e64-4049-8771-d4540403022c',
};

export const mockCreateCareRequestDataPayload: CreateUnauthenticatedCareRequestDataPayload =
  {
    care_request: {
      request_type: 'web',
      street_address_1: '1234 Test Street',
      street_address_2: 'Test County',
      city: 'Test',
      state: 'TES',
      zipcode: '80000',
      chief_complaint: 'Test complaint',
      patient_attributes: {
        first_name: 'John',
        last_name: 'Doe',
        mobile_number: '+13012312312',
        patient_email: '',
        dob: '2001-04-03T13:22:58Z',
        gender: 'M',
      },
      caller_attributes: {
        relationship_to_patient: 'patient',
        first_name: 'Jane',
        last_name: 'Doe',
        origin_phone: '+13012312312',
      },
      patient_preferred_eta_start: '2023-01-01T00:00:00Z',
      patient_preferred_eta_end: '2023-01-01T06:00:00Z',
      statsig_stable_id: '824e7861-4e64-4049-8771-d4540403022c',
    },
    'g-recaptcha-response-data': {
      request_care: 'test',
    },
  };
