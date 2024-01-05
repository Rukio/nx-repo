import { addressFormSchema } from './utils';

describe('utils', () => {
  describe('addressFormSchema', () => {
    it.each([
      {
        name: 'empty values',
        values: {
          zipCode: '',
          streetAddress1: '',
          streetAddress2: '',
          city: '',
          state: '',
          locationType: '',
          locationDetails: '',
          selectedAddressId: '',
        },
        props: {
          stateOptions: [],
          locationTypeOptions: [],
        },
        expectedResult: false,
      },
      {
        name: 'valid values',
        values: {
          zipCode: '80205',
          streetAddress1: '5830 Elliot Avenue',
          streetAddress2: '#202',
          city: 'Denver',
          state: 'CO',
          locationType: 'home',
          locationDetails: 'Parking is behind the building',
          selectedAddressId: '1',
        },
        props: {
          stateOptions: [{ value: 'CO', label: 'Colorado' }],
        },
        expectedResult: true,
      },
      {
        name: 'only selected existing wrapper is required',
        values: {
          zipCode: '',
          streetAddress1: '',
          streetAddress2: '',
          city: '',
          state: '',
          locationType: '',
          locationDetails: '',
          selectedAddressId: '1',
        },
        props: {
          stateOptions: [],
          locationTypeOptions: [],
        },
        expectedResult: true,
      },
    ])(
      'should return correct isValid result for $name',
      async ({ values, props, expectedResult }) => {
        const { stateOptions } = props;

        const isValid = await addressFormSchema(stateOptions).isValid(values);
        expect(isValid).toBe(expectedResult);
      }
    );
  });
});
