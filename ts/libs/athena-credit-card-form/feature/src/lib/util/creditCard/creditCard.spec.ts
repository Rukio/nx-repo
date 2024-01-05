import { getCreditCardLast4Digits, getCreditCardType } from './creditCard';

describe('creditCard', () => {
  describe('getCreditCardType', () => {
    it.each([
      {
        number: '4000 0000 0000 0002',
        expected: 'Visa',
      },
      {
        number: '5121 2121 2121 2124',
        expected: 'Mastercard',
      },
      {
        number: '6011 0000 0000 0004',
        expected: 'Discover',
      },
      {
        number: '371449635398431',
        expected: 'American Express',
      },
      {
        number: 'empty',
        expected: null,
      },
    ])(
      'should return correct $expected type if credit card number is $number',
      ({ expected, number }) => {
        const creditCardType = getCreditCardType(number);
        expect(creditCardType).toBe(expected);
      }
    );
  });

  describe('getCreditCardLast4Digits', () => {
    it.each([
      {
        number: '4000 0000 0000 0002',
        expected: '0002',
      },
      {
        number: '5121 2121 2121 2124',
        expected: '2124',
      },
      {
        number: '6011 0000 0000 0004',
        expected: '0004',
      },
      {
        number: '371449635398431',
        expected: '8431',
      },
      {
        number: '123456',
        expected: '',
      },
      {
        number: '',
        expected: '',
      },
    ])(
      'should return correct $expected last 4 digits if credit card number is $number',
      ({ expected, number }) => {
        const creditCardLast4Digits = getCreditCardLast4Digits(number);
        expect(creditCardLast4Digits).toBe(expected);
      }
    );
  });
});
