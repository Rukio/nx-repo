import {
  Gender,
  GenderIdentity,
  mockAccountPatients,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import { PatientDemographicsFormFieldValues } from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import {
  ADD_SOMEONE_ELSE_OPTION,
  getPatientDemographicsFormSchema,
  getPatientDemographicsFormWithNonSelfRelationshipSchema,
  getSelectedPatientIdSchema,
  isGenderIdentityOtherSelected,
} from './utils';

const patientDemographicsFormValidValues: PatientDemographicsFormFieldValues = {
  patientFirstName: 'John',
  patientMiddleName: 'Fitzgerald',
  patientLastName: 'Doe',
  patientSuffix: 'Junior',
  legalSex: Gender.Male,
  patientPhone: '3034441234',
  birthday: '01/01/2000',
};

const patientDemographicsFormWithNonSelfRelationshipValidValues: PatientDemographicsFormFieldValues =
  {
    patientFirstName: 'John',
    patientMiddleName: 'Fitzgerald',
    patientLastName: 'Doe',
    patientSuffix: 'Junior',
    legalSex: Gender.Male,
    patientPhone: '3034441234',
    birthday: '01/01/2000',
    requesterFirstName: 'Jack',
    requesterLastName: 'Doe',
    requesterPhone: '3034445678',
  };

describe('utils', () => {
  describe('getPatientDemographicsFormSchema', () => {
    it.each([
      {
        name: 'empty values',
        values: {
          patientFirstName: '',
          patientMiddleName: '',
          patientLastName: '',
          patientSuffix: '',
          assignedSexAtBirth: '',
          patientPhone: '',
          genderIdentity: '',
          birthday: '',
        },
        expectedResult: false,
      },
      {
        name: 'invalid phone',
        values: {
          ...patientDemographicsFormValidValues,
          patientPhone: '12345678',
        },
        expectedResult: false,
      },
      {
        name: 'invalid birthday',
        values: {
          ...patientDemographicsFormValidValues,
          birthday: '20/20/2000',
        },
        expectedResult: false,
      },
      {
        name: 'valid values',
        values: patientDemographicsFormValidValues,
        expectedResult: true,
      },
      {
        name: 'invalid gender identity details if gender identity is other',
        values: {
          ...patientDemographicsFormValidValues,
          genderIdentity: GenderIdentity.Other,
          genderIdentityDetails: '',
        },
        expectedResult: false,
      },
    ])(
      'should return correct valid result for $name',
      async ({ values, expectedResult }) => {
        const isValid = await getPatientDemographicsFormSchema({
          accountPatients: [],
        }).isValid(values);

        expect(isValid).toBe(expectedResult);
      }
    );
  });

  describe('getPatientDemographicsFormWithNonSelfRelationshipSchema', () => {
    it.each([
      {
        name: 'empty values',
        values: {
          patientFirstName: '',
          patientMiddleName: '',
          patientLastName: '',
          patientSuffix: '',
          assignedSexAtBirth: '',
          patientPhone: '',
          genderIdentity: '',
          birthday: '',
        },
        expectedResult: false,
      },
      {
        name: 'invalid phone',
        values: {
          ...patientDemographicsFormWithNonSelfRelationshipValidValues,
          patientPhone: '12345678',
        },
        expectedResult: false,
      },
      {
        name: 'invalid birthday',
        values: {
          ...patientDemographicsFormWithNonSelfRelationshipValidValues,
          birthday: '20/20/2000',
        },
        expectedResult: false,
      },
      {
        name: 'valid values',
        values: patientDemographicsFormWithNonSelfRelationshipValidValues,
        expectedResult: true,
      },
    ])(
      'should return correct valid result for $name',
      async ({ values, expectedResult }) => {
        const isValid =
          await getPatientDemographicsFormWithNonSelfRelationshipSchema({
            accountPatients: [],
          }).isValid(values);
        expect(isValid).toBe(expectedResult);
      }
    );
  });

  describe('getSelectedPatientIdSchema', () => {
    it.each([
      {
        name: 'empty value',
        value: '',
        expectedResult: false,
        accountPatients: mockAccountPatients,
      },
      {
        name: 'empty value with empty accountPatients list',
        value: '',
        expectedResult: true,
        accountPatients: [],
      },
      {
        name: 'valid value',
        value: mockAccountPatients[0].id,
        expectedResult: true,
        accountPatients: mockAccountPatients,
      },
      {
        name: 'valid ADD_SOMEONE_ELSE_OPTION value',
        value: ADD_SOMEONE_ELSE_OPTION,
        expectedResult: true,
        accountPatients: mockAccountPatients,
      },
      {
        name: 'invalid value',
        value: 'test',
        expectedResult: false,
        accountPatients: mockAccountPatients,
      },
    ])(
      'should return correct valid result for $name',
      async ({ value, expectedResult, accountPatients }) => {
        const isValid = await getSelectedPatientIdSchema({
          accountPatients,
        }).isValid(value);
        expect(isValid).toBe(expectedResult);
      }
    );
  });

  describe('isGenderIdentityOtherSelected', () => {
    it.each([
      { value: GenderIdentity.Male, expected: false },
      { value: GenderIdentity.Other, expected: true },
    ])(
      'should return correct boolean value for $value',
      ({ value, expected }) => {
        const result = isGenderIdentityOtherSelected(value);
        expect(result).toBe(expected);
      }
    );
  });
});
