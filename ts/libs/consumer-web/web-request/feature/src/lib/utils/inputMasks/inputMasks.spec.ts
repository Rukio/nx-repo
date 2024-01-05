import {
  phoneNumberWithoutCountry,
  transformValueFromPhone,
} from './inputMasks';

describe('inputMasks', () => {
  describe('transformValueFromPhone', () => {
    it.each([
      {
        name: 'should return empty string if value was not provided',
        value: undefined,
        expectedResult: '',
      },
      {
        name: 'should remove spaces and non digit characters',
        value: '+130 123 1231',
        expectedResult: '1301231231',
      },
    ])('$name', ({ value, expectedResult }) => {
      const result = transformValueFromPhone(value);
      expect(result).toBe(expectedResult);
    });
  });

  describe('phoneNumberWithoutCountry', () => {
    it.each([
      {
        name: 'should return empty string if value was not provided',
        value: undefined,
        expectedResult: '',
      },
      {
        name: 'should remove spaces and non digit characters',
        value: '+1301231231',
        expectedResult: '301231231',
      },
    ])('$name', ({ value, expectedResult }) => {
      const result = phoneNumberWithoutCountry(value);
      expect(result).toBe(expectedResult);
    });
  });
});
