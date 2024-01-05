import {
  DefaultConsentQuestionAnswer,
  MedicalDecisionMakerQuestionAnswer,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import {
  comparePatientNameToPOAName,
  consentFormSchema,
  consentFormWithNonSelfRequesterRelationSchema,
} from './utils';

describe('utils', () => {
  describe('consentFormSchema', () => {
    it.each([
      {
        name: 'empty values',
        values: {
          firstConsentQuestion: '',
          secondConsentQuestion: '',
          thirdConsentQuestion: '',
          firstName: '',
          lastName: '',
          phoneNumber: '',
        },
        expectedResult: false,
      },
      {
        name: 'invalid values',
        values: {
          firstConsentQuestion: 'test',
          secondConsentQuestion: 'test',
          thirdConsentQuestion: 'test',
          firstName: 'test',
          lastName: 'test',
          phoneNumber: '123',
        },
        expectedResult: false,
      },
      {
        name: 'first answer is positive',
        values: {
          firstConsentQuestion: DefaultConsentQuestionAnswer.Yes,
        },
        expectedResult: true,
      },
      {
        name: 'second answer is negative',
        values: {
          firstConsentQuestion: DefaultConsentQuestionAnswer.No,
          secondConsentQuestion: DefaultConsentQuestionAnswer.No,
        },
        expectedResult: true,
      },
      {
        name: 'second answer is positive and fields are valid',
        values: {
          firstConsentQuestion: DefaultConsentQuestionAnswer.No,
          secondConsentQuestion: DefaultConsentQuestionAnswer.Yes,
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '3034041234',
        },
        expectedResult: true,
      },
    ])(
      'should return correct valid result for $name',
      async ({ values, expectedResult }) => {
        const isValid = await consentFormSchema.isValid(values);
        expect(isValid).toBe(expectedResult);
      }
    );
  });

  describe('consentFormWithNonSelfRequesterRelationSchema', () => {
    it.each([
      {
        name: 'empty values',
        values: {
          firstConsentQuestion: '',
          secondConsentQuestion: '',
          thirdConsentQuestion: '',
          firstName: '',
          lastName: '',
          phoneNumber: '',
        },
        expectedResult: false,
      },
      {
        name: 'invalid values',
        values: {
          firstConsentQuestion: 'test',
          secondConsentQuestion: 'test',
          thirdConsentQuestion: 'test',
          firstName: 'test',
          lastName: 'test',
          phoneNumber: '123',
        },
        expectedResult: false,
      },
      {
        name: 'first answer is positive',
        values: {
          firstConsentQuestion: DefaultConsentQuestionAnswer.Yes,
        },
        expectedResult: true,
      },
      {
        name: 'second answer is negative',
        values: {
          firstConsentQuestion: DefaultConsentQuestionAnswer.No,
          secondConsentQuestion: DefaultConsentQuestionAnswer.No,
        },
        expectedResult: true,
      },
      {
        name: 'third answer is me',
        values: {
          firstConsentQuestion: DefaultConsentQuestionAnswer.No,
          secondConsentQuestion: DefaultConsentQuestionAnswer.Yes,
          thirdConsentQuestion: MedicalDecisionMakerQuestionAnswer.Me,
        },
        expectedResult: true,
      },
      {
        name: 'third answer is someone else and fields are valid',
        values: {
          firstConsentQuestion: DefaultConsentQuestionAnswer.No,
          secondConsentQuestion: DefaultConsentQuestionAnswer.Yes,
          thirdConsentQuestion: MedicalDecisionMakerQuestionAnswer.SomeoneElse,
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '3034041234',
        },
        expectedResult: true,
      },
    ])(
      'should return correct valid result for $name',
      async ({ values, expectedResult }) => {
        const isValid =
          await consentFormWithNonSelfRequesterRelationSchema.isValid(values);
        expect(isValid).toBe(expectedResult);
      }
    );
  });

  describe('comparePatientNameToPOAName', () => {
    it.each([
      {
        patientFullName: 'John Doe',
        patientPOAName: 'John Doe',
        expected: true,
        description: 'returns true when names match',
      },
      {
        patientFullName: 'John Doe',
        patientPOAName: 'Peter Doe',
        expected: false,
        description: 'handles different first names',
      },
      {
        patientFullName: 'John Doe',
        patientPOAName: 'John Peterson',
        expected: false,
        description: 'handles different last names',
      },
      {
        patientFullName: 'John Doe',
        patientPOAName: 'john doe',
        expected: true,
        description: 'handles different cases for same names',
      },
    ])('$description', ({ patientFullName, patientPOAName, expected }) => {
      const result = comparePatientNameToPOAName(
        patientFullName,
        patientPOAName
      );
      expect(result).toEqual(expected);
    });
  });
});
