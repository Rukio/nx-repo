import {
  mockPatient,
  mockPatientAccount,
  mockPatientAccountUnverifiedPatient,
} from '../../domain';
import { getPatientForPOA } from './utils';

describe('getPatientForPOA', () => {
  it.each([
    {
      isRequesterRelationshipSelf: true,
      patient: mockPatient,
      unverifiedPatient: null,
      patientAccount: mockPatientAccount,
      expected: mockPatient,
    },
    {
      isRequesterRelationshipSelf: true,
      patient: undefined,
      unverifiedPatient: mockPatientAccountUnverifiedPatient,
      patientAccount: mockPatientAccount,
      expected: mockPatientAccountUnverifiedPatient,
    },
    {
      isRequesterRelationshipSelf: false,
      patient: undefined,
      unverifiedPatient: mockPatientAccountUnverifiedPatient,
      patientAccount: mockPatientAccount,
      expected: mockPatientAccount,
    },
    {
      isRequesterRelationshipSelf: false,
      patient: undefined,
      unverifiedPatient: null,
      patientAccount: mockPatientAccount,
      expected: mockPatientAccount,
    },
    {
      isRequesterRelationshipSelf: true,
      patient: mockPatient,
      unverifiedPatient: mockPatientAccountUnverifiedPatient,
      patientAccount: mockPatientAccount,
      expected: mockPatient,
    },
  ])(
    'returns $expected when isRequesterRelationshipSelf is $isRequesterRelationshipSelf',
    ({
      isRequesterRelationshipSelf,
      patient,
      unverifiedPatient,
      patientAccount,
      expected,
    }) => {
      const result = getPatientForPOA(
        isRequesterRelationshipSelf,
        unverifiedPatient,
        patientAccount,
        patient
      );
      expect(result).toEqual(expected);
    }
  );
});
