import { hasValue, isValidZipCode, isValidPhoneNumber } from '../validators';

describe('validators', () => {
  describe('hasValue', () => {
    it('should return false for an empty string', () => {
      expect(hasValue('')).toBeFalsy();
    });

    it('should return false for white space string', () => {
      expect(hasValue('    ')).toBeFalsy();
    });

    it('should return true for a non-empty string', () => {
      expect(hasValue('string')).toBeTruthy();
    });

    it('should return false for an undefined value', () => {
      expect(hasValue(undefined)).toBeFalsy();
    });
  });

  describe('isValidZipCode', () => {
    it('should return true for a valid zip code', () => {
      expect(isValidZipCode('80022')).toBeTruthy();
    });

    it('should return false for a zip code with non numeric values', () => {
      expect(isValidZipCode('123ab')).toBeFalsy();
    });

    it('should return false for a zip code with less than 5 numbers', () => {
      expect(isValidZipCode('9678')).toBeFalsy();
    });

    it('should return false for a zip code with more than 5 numbers', () => {
      expect(isValidZipCode('967899')).toBeFalsy();
    });

    it('should return false for an empty string', () => {
      expect(isValidZipCode('')).toBeFalsy();
    });
  });

  describe('isValidPhoneNumber', () => {
    it('should return true for a valid phone number (not formatted)', () => {
      expect(isValidPhoneNumber('9175551212')).toBeTruthy();
    });

    it('should return true for a valid formatted phone number', () => {
      expect(isValidPhoneNumber('(917) 555-1212')).toBeTruthy();
    });

    it('should return false for an incomplete phone number', () => {
      expect(isValidPhoneNumber('917 34')).toBeFalsy();
    });

    it('should return false for an empty string', () => {
      expect(isValidPhoneNumber('')).toBeFalsy();
    });
  });
});
