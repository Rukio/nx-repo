import { ValidatorResponse, validate } from './validator';

describe('validator', () => {
  describe('validate', () => {
    it('should return a validator response with fields and isValidForm', () => {
      const state = { name: '', email: '' };
      const rules = { name: 'required', email: 'required|email' };
      const expected: ValidatorResponse = {
        isValidForm: false,
        fields: {
          name: {
            isValid: false,
            error: 'This field is required',
            isTouched: true,
          },
          email: {
            isValid: false,
            error: 'This field is required',
            isTouched: true,
          },
        },
      };
      const result = validate(state, rules);
      expect(result).toStrictEqual(expected);
    });

    it('should set isTouched to false for fields that have not changed', () => {
      const state = { name: 'John', email: '' };
      const rules = { name: 'required', email: 'required|email' };
      const initialValues = { name: 'John', email: '' };
      const result = validate(state, rules, initialValues);
      expect(result.fields.name.isTouched).toBe(false);
      expect(result.fields.email.isTouched).toBe(false);
    });

    it('should set isTouched to true for fields that have changed', () => {
      const state = { name: 'John', email: '' };
      const rules = { name: 'required', email: 'required|email' };
      const initialValues = { name: 'Jane', email: '' };
      const result = validate(state, rules, initialValues);
      expect(result.fields.name.isTouched).toBe(true);
      expect(result.fields.email.isTouched).toBe(false);
    });

    it('should set isValid to false and error message when required field is missing', () => {
      const state = { name: '', email: '' };
      const rules = { name: 'required', email: 'required|email' };
      const result = validate(state, rules);
      expect(result.fields.name.isValid).toBe(false);
      expect(result.fields.name.error).toBe('This field is required');
    });

    it('should set isValid to false and error message when field is not required', () => {
      const state = { name: 'test123' };
      const rules = { name: 'string' };
      const result = validate(state, rules);
      expect(result.fields.name.isValid).toBe(false);
      expect(result.fields.name.error).toBe(
        "This field should contain A-Z,-,.;'&/() and a space. Max length 50"
      );
    });

    it('should set isValid to false and error message when field is not phone number', () => {
      const state = { name: 'test123' };
      const rules = { name: 'phone' };
      const result = validate(state, rules);
      expect(result.fields.name.isValid).toBe(false);
      expect(result.fields.name.error).toBe(
        'Please enter a valid phone number.'
      );
    });

    it('should set isValid to false and error message when field is not phone number', () => {
      const state = { name: 'test123' };
      const rules = { name: 'birthday' };
      const result = validate(state, rules);
      expect(result.fields.name.isValid).toBe(false);
      expect(result.fields.name.error).toBe('Enter a valid date');
    });
  });
});
