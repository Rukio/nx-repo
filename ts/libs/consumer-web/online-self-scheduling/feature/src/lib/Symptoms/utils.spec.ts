import { symptomsFormSchema } from './utils';

describe('utils', () => {
  describe('symptomsFormSchema', () => {
    it.each([
      {
        name: 'empty values',
        values: {
          symptoms: '',
        },
        expectedResult: false,
      },
      {
        name: 'correct symptoms and isSymptomsConfirmChecked is falsy',
        values: {
          symptoms: 'cough',
          isSymptomsConfirmChecked: false,
        },
        expectedResult: false,
      },
      {
        name: 'correct symptoms and isSymptomsConfirmChecked is truthy',
        values: {
          symptoms: 'cough',
          isSymptomsConfirmChecked: true,
        },
        expectedResult: true,
      },
    ])(
      'should return correct valid result for $name',
      async ({ values, expectedResult }) => {
        const isValid = await symptomsFormSchema.isValid(values);
        expect(isValid).toBe(expectedResult);
      }
    );
  });
});
