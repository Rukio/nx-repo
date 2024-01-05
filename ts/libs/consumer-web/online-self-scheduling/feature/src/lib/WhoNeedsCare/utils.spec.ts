import { RelationToPatient } from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import { whoNeedsCareFormSchema } from './utils';

describe('utils', () => {
  describe('whoNeedsCareFormSchema', () => {
    it.each([
      {
        name: 'empty values',
        values: {
          relationToPatient: '',
        },
        expectedResult: false,
      },
      {
        name: 'incorrect values',
        values: {
          relationToPatient: 'test',
        },
        expectedResult: false,
      },
      {
        name: 'correct RelationToPatient.FamilyFriend',
        values: {
          relationToPatient: RelationToPatient.FamilyFriend,
        },
        expectedResult: true,
      },
      {
        name: 'correct RelationToPatient.FamilyFriend',
        values: {
          relationToPatient: RelationToPatient.Patient,
        },
        expectedResult: true,
      },
      {
        name: 'correct RelationToPatient.FamilyFriend',
        values: {
          relationToPatient: RelationToPatient.Clinician,
        },
        expectedResult: true,
      },
    ])(
      'should return correct valid result for $name',
      async ({ values, expectedResult }) => {
        const isValid = await whoNeedsCareFormSchema.isValid(values);
        expect(isValid).toBe(expectedResult);
      }
    );
  });
});
