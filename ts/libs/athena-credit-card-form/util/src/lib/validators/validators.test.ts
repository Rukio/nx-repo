import {
  validateRequiredField,
  validateCreditCardCVV,
  validateCreditCardExpirationDate,
  validateCreditCardNumber,
  validateZipCode,
  validateBillingStreetAddress,
} from './validators';

describe('validators', () => {
  describe('validateRequiredField', () => {
    it('should return isValid falsy and default error message if value is empty string', () => {
      const result = validateRequiredField('');
      expect(result.isValid).toBeFalsy();
      expect(result.errorMessage).toBe('This field is required');
    });

    it('should return isValid falsy and custom error message if value is empty string', () => {
      const customErrorMessage = 'custom error';
      const result = validateRequiredField('', customErrorMessage);
      expect(result.isValid).toBeFalsy();
      expect(result.errorMessage).toBe(customErrorMessage);
    });

    it('should return isValid falsy and default error message if value is string with whitespace', () => {
      const result = validateRequiredField('    ');
      expect(result.isValid).toBeFalsy();
      expect(result.errorMessage).toBe('This field is required');
    });

    it('should return isValid truthy and empty error message if value is not empty', () => {
      const result = validateRequiredField('test');
      expect(result.isValid).toBeTruthy();
      expect(result.errorMessage).toBe('');
    });
  });

  describe('validateZipCode', () => {
    it('should return isValid falsy and default error message if value is empty string', () => {
      const result = validateZipCode('');
      expect(result.isValid).toBeFalsy();
      expect(result.errorMessage).toBe('Invalid zip code');
    });

    it('should return isValid falsy and custom error message if value is empty string', () => {
      const customErrorMessage = 'custom error';
      const result = validateZipCode('', customErrorMessage);
      expect(result.isValid).toBeFalsy();
      expect(result.errorMessage).toBe(customErrorMessage);
    });

    it('should return isValid falsy and default error message if value is not full zip code', () => {
      const result = validateZipCode('123');
      expect(result.isValid).toBeFalsy();
      expect(result.errorMessage).toBe('Invalid zip code');
    });

    it('should return isValid falsy and default error message if value is 5-digit zip code with hyphen', () => {
      const result = validateZipCode('12345-');
      expect(result.isValid).toBeFalsy();
      expect(result.errorMessage).toBe('Invalid zip code');
    });

    it('should return isValid falsy and default error message if value is not full 9-digit zip code with hyphen', () => {
      const result = validateZipCode('12345-123');
      expect(result.isValid).toBeFalsy();
      expect(result.errorMessage).toBe('Invalid zip code');
    });

    it('should return isValid truthy and empty error message if value is valid 5-digit zip code', () => {
      const result = validateZipCode('12345');
      expect(result.isValid).toBeTruthy();
      expect(result.errorMessage).toBe('');
    });

    it('should return isValid truthy and empty error message if value is valid 9-digit zip code', () => {
      const result = validateZipCode('12345-6789');
      expect(result.isValid).toBeTruthy();
      expect(result.errorMessage).toBe('');
    });
  });

  describe('validateCreditCardNumber', () => {
    it('should return isValid falsy and default error message if value is empty string', () => {
      const result = validateCreditCardNumber('');
      expect(result.isValid).toBeFalsy();
      expect(result.errorMessage).toBe('Invalid credit card number');
    });

    it('should return isValid falsy and custom error message if value is empty string', () => {
      const customErrorMessage = 'custom error';
      const result = validateCreditCardNumber('', customErrorMessage);
      expect(result.isValid).toBeFalsy();
      expect(result.errorMessage).toBe(customErrorMessage);
    });

    it('should return isValid falsy and default error message if value is not full card number', () => {
      const result = validateCreditCardNumber('41');
      expect(result.isValid).toBeFalsy();
      expect(result.errorMessage).toBe('Invalid credit card number');
    });

    it('should return isValid truthy and empty error message if value is 16-digit valid card number', () => {
      const result = validateCreditCardNumber('4111111111111111');
      expect(result.isValid).toBeTruthy();
      expect(result.errorMessage).toBe('');
    });

    it('should return isValid truthy and empty error message if value is 16-digit valid card number with whitespace', () => {
      const result = validateCreditCardNumber('4111 1111 1111 1111');
      expect(result.isValid).toBeTruthy();
      expect(result.errorMessage).toBe('');
    });
  });

  describe('validateCreditCardCVV', () => {
    it('should return isValid falsy and default error message if value is empty string', () => {
      const result = validateCreditCardCVV('');
      expect(result.isValid).toBeFalsy();
      expect(result.errorMessage).toBe('Invalid credit card CVV');
    });

    it('should return isValid falsy and custom error message if value is empty string', () => {
      const customErrorMessage = 'custom error';
      const result = validateCreditCardCVV('', customErrorMessage);
      expect(result.isValid).toBeFalsy();
      expect(result.errorMessage).toBe(customErrorMessage);
    });

    it('should return isValid falsy and default error message if value is not full CVV', () => {
      const result = validateCreditCardCVV('12');
      expect(result.isValid).toBeFalsy();
      expect(result.errorMessage).toBe('Invalid credit card CVV');
    });

    it('should return isValid truthy and empty error message if value is 3-digit valid CVV', () => {
      const result = validateCreditCardCVV('123');
      expect(result.isValid).toBeTruthy();
      expect(result.errorMessage).toBe('');
    });

    it('should return isValid truthy and empty error message if value is 4-digit valid CVV', () => {
      const result = validateCreditCardCVV('1234');
      expect(result.isValid).toBeTruthy();
      expect(result.errorMessage).toBe('');
    });
  });

  describe('validateCreditCardExpirationDate', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2020-01-01'));
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should return isValid falsy and default error message if value is empty string', () => {
      const result = validateCreditCardExpirationDate('');
      expect(result.isValid).toBeFalsy();
      expect(result.errorMessage).toBe('Invalid credit card expiration date');
    });

    it('should return isValid falsy and custom error message if value is empty string', () => {
      const customErrorMessage = 'custom error';
      const result = validateCreditCardExpirationDate('', customErrorMessage);
      expect(result.isValid).toBeFalsy();
      expect(result.errorMessage).toBe(customErrorMessage);
    });

    it('should return isValid falsy and default error message if value is only month', () => {
      const result = validateCreditCardExpirationDate('12');
      expect(result.isValid).toBeFalsy();
      expect(result.errorMessage).toBe('Invalid credit card expiration date');
    });

    it('should return isValid truthy and empty error message if value is without valid year', () => {
      const result = validateCreditCardExpirationDate('12/1');
      expect(result.isValid).toBeFalsy();
      expect(result.errorMessage).toBe('Invalid credit card expiration date');
    });

    it('should return isValid truthy and empty error message if value is with year in the past', () => {
      const result = validateCreditCardExpirationDate('12/2019');
      expect(result.isValid).toBeFalsy();
      expect(result.errorMessage).toBe('Invalid credit card expiration date');
    });

    it('should return isValid truthy and empty error message if value is valid expiration date', () => {
      const result = validateCreditCardExpirationDate('12/2020');
      expect(result.isValid).toBeTruthy();
      expect(result.errorMessage).toBe('');
    });
  });

  describe('validateBillingStreetAddress', () => {
    it('should return isValid falsy and default error message if value is empty string', () => {
      const result = validateBillingStreetAddress('');
      expect(result.isValid).toBeFalsy();
      expect(result.errorMessage).toBe('Invalid billing street address');
    });

    it('should return isValid falsy and custom error message if value is empty string', () => {
      const customErrorMessage = 'custom error';
      const result = validateBillingStreetAddress('', customErrorMessage);
      expect(result.isValid).toBeFalsy();
      expect(result.errorMessage).toBe(customErrorMessage);
    });

    it('should return isValid falsy and default error message if value is string with whitespace', () => {
      const result = validateBillingStreetAddress('    ');
      expect(result.isValid).toBeFalsy();
      expect(result.errorMessage).toBe('Invalid billing street address');
    });

    it('should return isValid falsy and default error message if value length is bigger than max', () => {
      const result = validateBillingStreetAddress(
        'Too long billing street address'
      );
      expect(result.isValid).toBeFalsy();
      expect(result.errorMessage).toBe('Invalid billing street address');
    });

    it('should return isValid truthy and empty error message if value is not empty', () => {
      const result = validateBillingStreetAddress('12 Main St.');
      expect(result.isValid).toBeTruthy();
      expect(result.errorMessage).toBe('');
    });
  });
});
