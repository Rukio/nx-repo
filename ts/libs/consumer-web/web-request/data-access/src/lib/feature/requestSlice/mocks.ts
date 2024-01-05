import { PatientPreferredEta } from '@*company-data-covered*/consumer-web-types';
import {
  RequestAddress,
  RequestCaller,
  RequestComplaint,
  RequestPatient,
  RelationshipToPatient,
} from './types';

export const mockAddress: RequestAddress = {
  streetAddress1: 'Address 1',
  streetAddress2: 'Address 2',
  city: 'Test',
  state: 'Test state',
  postalCode: '00000',
};

export const mockComplaint: RequestComplaint = {
  symptoms: 'Symptom 1, Symptom 2',
};

export const mockPatient: RequestPatient = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'test@test.com',
  phone: '+13012312123',
  birthday: '1963-01-01T00:00:00Z',
  sex: 'M',
};

export const mockCaller: RequestCaller = {
  relationshipToPatient: RelationshipToPatient.myself,
  firstName: 'John',
  lastName: 'Doe',
  phone: '+13012312123',
};

export const mockPatientPreferredEta: PatientPreferredEta = {
  patientPreferredEtaStart: '2020-04-30T07:00:00.000Z',
  patientPreferredEtaEnd: '2020-04-30T12:00:00.000Z',
};
