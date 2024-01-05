import { isTruthyOrError } from './type-validation';

describe('type validation', () => {
  describe('isTruthyOrError', () => {
    it.each([
      { desc: 'string', input: 'defined' },
      { desc: 'empty object', input: {} },
      { desc: 'empty array', input: [] },
    ])('should throw error for truthy input: $desc', ({ input }) => {
      expect(isTruthyOrError(input)).toBe(input);
    });

    it.each([
      { desc: 'undefined', input: undefined },
      { desc: 'false', input: false },
      { desc: 'empty string', input: '' },
    ])('should throw error for falsey input: $desc', ({ input }) => {
      expect(() => isTruthyOrError(input)).toThrowError(
        /expected given value to be truthy/
      );
    });
  });
});
