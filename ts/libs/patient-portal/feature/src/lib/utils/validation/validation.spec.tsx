import { addressValidationSchema } from '../../utils/validation';

describe('validation', () => {
  describe('addressValidationSchema', () => {
    it.each([
      {
        testCase: 'form is empty',
        formValues: {
          streetAddress1: '',
          streetAddress2: '',
          locationDetails: '',
          city: '',
          state: '',
        },
        isValid: false,
      },
      {
        testCase: 'street address 1 is filled',
        formValues: {
          streetAddress1: 'street address 1',
          streetAddress2: '',
          locationDetails: '',
          city: '',
          state: '',
        },
        isValid: false,
      },
      {
        testCase: 'street address 1 and city is filled',
        formValues: {
          streetAddress1: 'street address 1',
          streetAddress2: '',
          locationDetails: '',
          city: 'city',
          state: '',
        },
        isValid: false,
      },
      {
        testCase: 'street address 1, city and state is filled',
        formValues: {
          streetAddress1: 'street address 1',
          streetAddress2: '',
          locationDetails: '',
          city: 'city',
          state: 'CO',
        },
        isValid: false,
      },
      {
        testCase: 'zip code has wrong format',
        formValues: {
          streetAddress1: 'street address 1',
          streetAddress2: '',
          locationDetails: '',
          city: 'city',
          state: 'CO',
          zipCode: '1234',
        },
        isValid: false,
      },
      {
        testCase: 'zip code has wrong format with dash',
        formValues: {
          streetAddress1: 'street address 1',
          streetAddress2: '',
          locationDetails: '',
          city: 'city',
          state: 'CO',
          zipCode: '12345-',
        },
        isValid: false,
      },
      {
        testCase: 'fields are valid',
        formValues: {
          streetAddress1: 'street address 1',
          streetAddress2: '',
          locationDetails: '',
          city: 'city',
          state: 'CO',
          zipCode: '12345',
        },
        isValid: true,
      },
      {
        testCase: 'fields are valid with 9 digits in zip',
        formValues: {
          streetAddress1: 'street address 1',
          streetAddress2: '',
          locationDetails: '',
          city: 'city',
          state: 'CO',
          zipCode: '12345-8569',
        },
        isValid: true,
      },
    ])(
      'should return correct validation result when $testCase',
      async ({ formValues, isValid }) => {
        const validationResult = await addressValidationSchema.isValid(
          formValues
        );

        expect(validationResult).toBe(isValid);
      }
    );
  });
});
